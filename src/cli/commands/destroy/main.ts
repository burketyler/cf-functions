import {
  CacheBehavior,
  DefaultCacheBehavior,
  FunctionAssociation,
} from "aws-sdk/clients/cloudfront.js";
import cloneDeep from "clone-deep";
import ora, { Ora } from "ora";
import { join } from "path";
import { CommandBuilder, CommandModule } from "yargs";

import {
  CloudFrontError,
  deleteFunction,
  describeFunction,
  DistributionResult,
  FunctionStage,
  listFunctions,
  updateDistribution,
} from "../../../aws/index.js";
import { LogBuilder } from "../../../logging/builder.js";
import { logger } from "../../../logging/index.js";
import { FunctionConfigMap } from "../../../types.js";
import { DEFAULT_ARGS } from "../../consts.js";
import {
  AssociateResult,
  AssociateResultError,
  AssociationManifest,
  ManifestAssociation,
} from "../../types.js";
import {
  createAssociationManifest,
  doesAssociationExist,
  findBehaviour,
  haveAssociationsChanged,
  parseConfigFile,
  parseEnvFile,
  pollDistributionsForDeployedStatus,
  settlePromises,
} from "../../utils.js";

import { DeleteResult, DeleteResultError, DestroyArgs } from "./types.js";

const command = "destroy";

const desc =
  "Disassociate functions with CloudFront Distributions and remove them from AWS.";

const builder: CommandBuilder = {
  ...DEFAULT_ARGS,
};

const handler = async (args: DestroyArgs) => {
  parseEnvFile(args.env);

  logger.info("Starting command 'destroy'.");

  const [config, liveFunctions] = await Promise.all([
    parseConfigFile(join(process.cwd(), args.config)),
    listFunctions(FunctionStage.LIVE),
  ]);

  logger.printFunctionConfigList(config.functions);

  logger.info("Disassociating functions from CloudFront Distributions:\n");

  const associationManifest = await createAssociationManifest(
    config.functions,
    liveFunctions,
    false
  );

  await settleAndPrintDisassociateResults(
    processAssociationManifest(associationManifest)
  );

  await pollDistributionsForDeployedStatus(associationManifest);

  logger.info(`\nDeleting functions.\n`);

  await settleAndPrintDeleteResults(destroyAllFunctions(config.functions));

  logger.info("Finishing command 'destroy'.");
};

function processAssociationManifest(
  manifest: AssociationManifest
): Promise<AssociateResult>[] {
  return Object.values(manifest).map(async ({ associations, distribution }) =>
    disassociateFunctionsFromDistribution(associations, distribution)
  );
}

async function disassociateFunctionsFromDistribution(
  associations: ManifestAssociation[],
  distribution: DistributionResult
): Promise<AssociateResult> {
  const progress = ora({
    indent: 2,
    text: `Removing associated functions for ${distribution.id}.`,
  }).start();

  try {
    let newDistribution = cloneDeep(distribution);

    removeAssociationsFromDistribution(associations, newDistribution, progress);

    if (haveAssociationsChanged(newDistribution, distribution)) {
      newDistribution = await updateDistribution(newDistribution);
    }

    progress.succeed(`Removed associated functions for ${distribution.id}.`);

    return {
      associations,
      distribution: newDistribution,
    };
  } catch (error) {
    progress.fail(`Failed to remove associations for ${distribution.id}.`);

    throw {
      distribution,
      error,
    } as AssociateResultError;
  }
}

function removeAssociationsFromDistribution(
  associations: ManifestAssociation[],
  distribution: DistributionResult,
  progress: Ora
): void {
  associations.forEach((association) => {
    const { PathPattern, FunctionARN } = association;

    progress.text = `Removing ${FunctionARN} from ${distribution.id} (${PathPattern}).`;

    removeAssociation(association, findBehaviour(PathPattern, distribution));
  });
}

function removeAssociation(
  association: FunctionAssociation,
  behaviour: CacheBehavior | DefaultCacheBehavior
): void {
  if (!doesAssociationExist(association, behaviour.FunctionAssociations)) {
    return;
  }

  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  behaviour.FunctionAssociations!.Items =
    behaviour.FunctionAssociations!.Items!.splice(
      behaviour.FunctionAssociations!.Items!.indexOf(association),
      1
    );
  behaviour.FunctionAssociations!.Quantity--;
  /* eslint-enable @typescript-eslint/no-non-null-assertion */
}

async function settleAndPrintDisassociateResults(
  resultsPromise: Promise<AssociateResult>[]
) {
  const { successList, rejectList } = await settlePromises<
    AssociateResult,
    AssociateResultError
  >(resultsPromise);

  if (successList?.[0]) {
    printDisassociateResults(successList);
  }

  if (rejectList?.[0]) {
    printDisassociateResultErrors(rejectList);
  }
}

function printDisassociateResults(results: AssociateResult[]) {
  new LogBuilder({
    color: "yellow",
    message: `\nSuccessfully removed function associations:`,
  })
    .break(2)
    .list(
      results.map(({ distribution, associations }) => ({
        message: `${distribution.id} [ETag: ${distribution.eTag}]`,
        color: "cyan",
        children: associations.map(
          ({ PathPattern, EventType, FunctionARN }) => ({
            bullet: "numbered",
            message: `${FunctionARN} -X (Pattern: ${PathPattern}) [Event: ${EventType}]`,
            color: "redBright",
          })
        ),
      }))
    )
    .log();
}

function printDisassociateResultErrors(errors: AssociateResultError[]) {
  new LogBuilder({
    color: "red",
    message: `\nFailed to associate functions:`,
  })
    .break(2)
    .list(
      errors.map(({ distribution, error }) => ({
        message: distribution.id,
        children: [
          {
            bullet: "",
            message: error.name,
            children: [
              {
                bullet: "",
                message: error.message,
                children: [{ bullet: "", message: error.stack ?? "N/A" }],
              },
            ],
          },
        ],
      }))
    )
    .log();
}

function destroyAllFunctions(
  functionMap: FunctionConfigMap
): Promise<DeleteResult>[] {
  return Object.keys(functionMap).map(async (functionName) => {
    const progress = ora({
      indent: 2,
      text: `Deleting ${functionName}`,
    }).start();

    try {
      try {
        const { eTag } = await describeFunction(functionName);
        await deleteFunction(functionName, eTag);

        progress.succeed(`Successfully deleted ${functionName}`);
      } catch (error) {
        if (error.name === CloudFrontError.FUNCTION_NOT_FOUND) {
          progress.warn(`Function ${functionName} doesn't exist`);
        } else {
          throw error;
        }
      }

      return {
        functionName,
      };
    } catch (error) {
      progress.fail(`Failed to delete ${functionName}`);

      throw {
        functionName,
        error,
      };
    }
  });
}

async function settleAndPrintDeleteResults(
  resultsPromise: Promise<DeleteResult>[]
) {
  const { successList, rejectList } = await settlePromises<
    DeleteResult,
    DeleteResultError
  >(resultsPromise);

  if (successList?.[0]) {
    printDeleteResults(successList);
  }

  if (rejectList?.[0]) {
    printDeleteResultErrors(rejectList);
  }
}

function printDeleteResults(results: DeleteResult[]) {
  new LogBuilder({
    color: "yellow",
    message: `\nSuccessfully deleted functions:`,
  })
    .break(2)
    .list(
      results.map(({ functionName }) => ({
        message: functionName,
        color: "red",
      }))
    )
    .log();
}

function printDeleteResultErrors(errors: DeleteResultError[]) {
  new LogBuilder({
    color: "red",
    message: `\nFailed to delete functions:`,
  })
    .break(2)
    .list(
      errors.map(({ functionName, error }) => ({
        message: functionName,
        children: [
          {
            bullet: "",
            message: error.name,
            children: [
              {
                bullet: "",
                message: error.message,
                children: [{ bullet: "", message: error.stack ?? "N/A" }],
              },
            ],
          },
        ],
      }))
    )
    .log();
}

export default {
  command,
  desc,
  builder,
  handler,
} as CommandModule<{}, DestroyArgs>; // eslint-disable-line @typescript-eslint/ban-types
