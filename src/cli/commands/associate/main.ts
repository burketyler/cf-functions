import { FunctionAssociations } from "aws-sdk/clients/cloudfront.js";
import cloneDeep from "clone-deep";
import ora, { Ora } from "ora";
import { CommandBuilder, CommandModule } from "yargs";

import {
  DistributionResult,
  FunctionStage,
  listFunctions,
  updateDistribution,
} from "../../../aws/index.js";
import { LogBuilder } from "../../../logging/builder.js";
import { logger } from "../../../logging/index.js";
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
  pollDistributionsForDeployedStatus,
  settlePromises,
} from "../../utils.js";

import { AssociateArgs } from "./types.js";

const command = "associate";

const desc =
  "Associate functions in 'LIVE' stage with configured CloudFront distribution behaviours.";

const builder: CommandBuilder = {
  ...DEFAULT_ARGS,
};

const handler = async (args: AssociateArgs) => {
  logger.info("Starting command 'associate'.");

  const [config, deployedFunctions] = await Promise.all([
    parseConfigFile(args.config),
    listFunctions(FunctionStage.LIVE),
  ]);

  logger.printFunctionConfigList(config.functions);

  logger.info(`Associating functions with CloudFront Distributions:\n`);

  const manifest = await createAssociationManifest(
    config.functions,
    deployedFunctions
  );

  const associatePromises = processAssociationManifest(manifest);

  await settleAndPrintAssociateResults(associatePromises);

  await pollDistributionsForDeployedStatus(manifest);

  logger.info("Finishing command 'associate'.");
};

function processAssociationManifest(
  manifest: AssociationManifest
): Promise<AssociateResult>[] {
  return Object.values(manifest).map(async ({ associations, distribution }) =>
    associateFunctionsWithDistribution(associations, distribution)
  );
}

async function associateFunctionsWithDistribution(
  associations: ManifestAssociation[],
  distribution: DistributionResult
): Promise<AssociateResult> {
  const progress = ora({
    indent: 2,
    text: `Creating associations for ${distribution.id}.`,
  }).start();

  try {
    let newDistribution = cloneDeep(distribution);

    addAssociationsToDistribution(associations, newDistribution, progress);

    if (haveAssociationsChanged(newDistribution, distribution)) {
      newDistribution = await updateDistribution(newDistribution);
    }

    progress.succeed(`Created all associations for ${distribution.id}.`);

    return {
      associations,
      distribution: newDistribution,
    };
  } catch (error) {
    progress.fail(`Failed to create associations for ${distribution.id}.`);

    throw {
      distribution,
      error,
    } as AssociateResultError;
  }
}

function addAssociationsToDistribution(
  associations: ManifestAssociation[],
  distribution: DistributionResult,
  progress: Ora
): void {
  associations.forEach((association) => {
    const { PathPattern, FunctionARN, EventType } = association;

    progress.text = `Associating ${FunctionARN} with ${distribution.id} (${PathPattern}).`;

    const behaviour = findBehaviour(PathPattern, distribution);

    const newAssociations: Required<FunctionAssociations> = {
      Items: Array.from(behaviour.FunctionAssociations?.Items ?? []),
      Quantity: behaviour.FunctionAssociations?.Quantity ?? 0,
    };

    if (!doesAssociationExist(association, newAssociations)) {
      newAssociations.Items.push({ EventType, FunctionARN });
      newAssociations.Quantity++;
    }

    behaviour.FunctionAssociations = newAssociations;
  });
}

async function settleAndPrintAssociateResults(
  resultsPromise: Promise<AssociateResult>[]
) {
  const { successList, rejectList } = await settlePromises<
    AssociateResult,
    AssociateResultError
  >(resultsPromise);

  if (successList?.[0]) {
    printAssociateResults(successList);
  }

  if (rejectList?.[0]) {
    printAssociateResultErrors(rejectList);
  }
}

export function printAssociateResults(results: AssociateResult[]) {
  new LogBuilder({
    color: "yellow",
    message: `\nSuccessfully associated functions:`,
  })
    .break(2)
    .list(
      results.map(({ distribution, associations }) => ({
        message: `${distribution.id} [ETag: ${distribution.eTag}]`,
        color: "cyan",
        children: associations.map(
          ({ PathPattern, EventType, FunctionARN }) => ({
            bullet: "numbered",
            message: `${FunctionARN} -> (Pattern: ${PathPattern}) [Event: ${EventType}]`,
            color: "greenBright",
          })
        ),
      }))
    )
    .log();
}

export function printAssociateResultErrors(errors: AssociateResultError[]) {
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

export default {
  command,
  desc,
  builder,
  handler,
} as CommandModule<{}, AssociateArgs>; // eslint-disable-line @typescript-eslint/ban-types
