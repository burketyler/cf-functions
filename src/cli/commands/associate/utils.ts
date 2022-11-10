import {
  CacheBehavior,
  DefaultCacheBehavior,
  FunctionAssociation,
  FunctionAssociations,
  FunctionSummary,
} from "aws-sdk/clients/cloudfront.js";
import cloneDeep from "clone-deep";
import ora, { Ora } from "ora";

import { fetchDistributionStatus } from "../../../aws/cloud-front/distribution.js";
import {
  DistributionResult,
  fetchDistribution,
  updateDistribution,
} from "../../../aws/index.js";
import { LogBuilder } from "../../../logging/builder.js";
import { BehaviourPattern, FunctionConfigMap } from "../../../types.js";
import { findFunction, settlePromises, sleep } from "../../utils.js";

import {
  AssociateResult,
  AssociateResultError,
  AssociationManifest,
  ManifestAssociation,
  StatusPollResult,
  StatusPollResultError,
} from "./types.js";

export async function createAssociationManifest(
  functionConfigMap: FunctionConfigMap,
  deployedFunctions: FunctionSummary[]
): Promise<AssociationManifest> {
  const manifest: AssociationManifest = {};
  const distributions = await getAssociatedDistributions(functionConfigMap);

  assertFunctionDistributionCompatibility(functionConfigMap, distributions);

  for (const functionName in functionConfigMap) {
    const { associations } = functionConfigMap[functionName];

    for (const association of associations) {
      {
        const { behaviourPattern, distributionId, eventType } = association;
        const deployedFunction = findFunction(functionName, deployedFunctions);

        if (!manifest[distributionId]) {
          manifest[distributionId] = {
            distribution: distributions[distributionId],
            associations: [],
          };
        }

        manifest[distributionId].associations.push({
          PathPattern: behaviourPattern,
          EventType: eventType,
          FunctionARN: deployedFunction.FunctionMetadata.FunctionARN,
        });
      }
    }
  }

  return manifest;
}

async function getAssociatedDistributions(
  functionConfigs: FunctionConfigMap
): Promise<{ [distId: string]: DistributionResult }> {
  const distributions = await Promise.all(
    Object.values(functionConfigs).flatMap(({ associations }) =>
      associations.map(({ distributionId }) =>
        fetchDistribution(distributionId)
      )
    )
  );

  return distributions.reduce(
    (accumulator: { [distId: string]: DistributionResult }, distribution) => {
      if (!accumulator[distribution.id]) {
        accumulator[distribution.id] = distribution;
      }

      return accumulator;
    },
    {}
  );
}

export function assertFunctionDistributionCompatibility(
  functionConfigMap: FunctionConfigMap,
  distributionMap: { [distId: string]: DistributionResult }
): void {
  for (const functionName in functionConfigMap) {
    const { associations } = functionConfigMap[functionName];

    associations.forEach(({ distributionId, behaviourPattern }) => {
      if (
        !doesBehaviourExist(behaviourPattern, distributionMap[distributionId])
      ) {
        throw new Error(
          `Distribution '${distributionId}' has no cache behaviour matching pattern '${behaviourPattern}'. Unable to associate function '${functionName}'.`
        );
      }
    });
  }
}

function doesBehaviourExist(
  pattern: BehaviourPattern,
  distribution: DistributionResult | undefined
): boolean {
  return (
    pattern === "default" ||
    !!distribution?.config.CacheBehaviors?.Items?.find(
      (behaviour) => behaviour.PathPattern === pattern
    )
  );
}

export async function associateFunctionsWithDistribution(
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

function getBehaviour(
  pathPattern: BehaviourPattern,
  distribution: DistributionResult
): CacheBehavior | DefaultCacheBehavior {
  if (pathPattern === "default") {
    return distribution.config.DefaultCacheBehavior;
  }

  // We know this exists because assertFunctionDistributionCompatibility has been called in createAssociationManifest
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return distribution.config.CacheBehaviors!.Items!.find(
    ({ PathPattern }) => PathPattern === pathPattern
  )!;
}

function addAssociationsToDistribution(
  associations: ManifestAssociation[],
  distribution: DistributionResult,
  progress: Ora
): void {
  associations.forEach((association) => {
    const { PathPattern, FunctionARN, EventType } = association;

    progress.text = `Associating ${FunctionARN} with ${distribution.id} (${PathPattern}).`;

    const behaviour = getBehaviour(PathPattern, distribution);

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

function haveAssociationsChanged(
  newDistribution: DistributionResult,
  oldDistribution: DistributionResult
): boolean {
  let hasChanged = haveBehaviourAssociationsChanged(
    newDistribution.config.DefaultCacheBehavior,
    oldDistribution.config.DefaultCacheBehavior
  );

  newDistribution.config.CacheBehaviors?.Items?.forEach((newBehaviour) => {
    const oldBehaviour = oldDistribution.config.CacheBehaviors?.Items?.find(
      (b) => b.PathPattern === newBehaviour.PathPattern
    );

    if (haveBehaviourAssociationsChanged(newBehaviour, oldBehaviour)) {
      hasChanged = true;
    }
  });

  return hasChanged;
}

function haveBehaviourAssociationsChanged(
  newBehaviour: CacheBehavior | DefaultCacheBehavior,
  oldBehaviour: CacheBehavior | DefaultCacheBehavior | undefined
): boolean {
  let hasChanged = false;

  newBehaviour.FunctionAssociations?.Items?.forEach((newAssociation) => {
    if (
      !doesAssociationExist(newAssociation, oldBehaviour?.FunctionAssociations)
    ) {
      hasChanged = true;
    }
  });

  return hasChanged;
}

function doesAssociationExist(
  association: FunctionAssociation,
  associations: FunctionAssociations | undefined
): boolean {
  return !!associations?.Items?.find(
    (a) =>
      a.FunctionARN === association.FunctionARN &&
      a.EventType === association.EventType
  );
}

export async function settleAndPrintAssociateResults(
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

export async function pollDistributionForDeployedStatus(
  distribution: DistributionResult
): Promise<void> {
  const { id } = distribution;
  let status: string | undefined;
  let isElapsed = false;

  const progress = ora({
    indent: 2,
    text: `Waiting for 'Deployed' status on ${id}.`,
  }).start();

  const elapsedTimeout = setTimeout(() => {
    isElapsed = true;
  }, 600_000); // 10 Minutes

  while (!status || (status === "InProgress" && !isElapsed)) {
    await sleep(1000);

    status = await fetchDistributionStatus(id);
  }

  clearTimeout(elapsedTimeout);

  if (status !== "InProgress" && status !== "Deployed") {
    progress.fail(
      `Distribution ${id} status '${status}' not deployed after 10 minutes.`
    );
  } else {
    progress.succeed(`Distribution ${id} deployed.`);
  }
}
