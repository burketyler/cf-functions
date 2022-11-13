import {
  CacheBehavior,
  DefaultCacheBehavior,
  FunctionAssociation,
  FunctionAssociations,
  FunctionSummary,
} from "aws-sdk/clients/cloudfront.js";
import { existsSync, readFileSync } from "fs";
import ora from "ora";
import { join } from "path";

import {
  CloudFrontError,
  DistributionResult,
  fetchDistribution,
  fetchDistributionStatus,
  FunctionInputs,
  FunctionResult,
  FunctionStage,
  listFunctions,
} from "../aws/index.js";
import { LogBuilder } from "../logging/builder.js";
import { logger } from "../logging/index.js";
import { configSchema } from "../schemas.js";
import { BehaviourPattern, Config, FunctionConfigMap } from "../types.js";

import {
  AssociationManifest,
  FunctionManifest,
  FunctionResultError,
} from "./types.js";

export function sleep(timeoutMs: number): Promise<void> {
  return new Promise((r) => setTimeout(r, timeoutMs));
}

export async function parseConfigFile(path: string): Promise<Config> {
  logger.info("Loading function configuration.");

  assertFileExists(path, "Failed to locate configuration.");

  const config: Config = (await import(path))?.default;

  if (!config || typeof config !== "object" || !config.functions) {
    logger.fatal(
      "Failed to import from config.",
      `File: '${path}'`,
      "Is it exported as 'default'?"
    );
    process.exit(1);
  }

  const { error } = configSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    logger.fatal(
      "Invalid configuration detected:",
      `File: '${path}'`,
      ...error.details.map(({ message }, index) => `${index + 1}. ${message}`)
    );
    process.exit(1);
  }

  return config;
}

export function parseHandlerCode(path: string): string {
  assertFileExists(path, "Failed to locate function handler.");

  return readFileSync(path, "utf-8");
}

function assertFileExists(path: string, errorMessage: string): void {
  const fileExists = existsSync(path);

  if (!fileExists) {
    logger.fatal(errorMessage, `File: '${path}'`);
    process.exit(1);
  }
}

export function findFunction(name: string, list: FunctionSummary[]) {
  const fn = list.find((depFn) => depFn.Name === name);

  if (!fn) {
    throw new Error(`Function ${name} not found in AWS.`);
  }

  return fn;
}

export async function settlePromises<SuccessType, RejectType>(
  promises: Promise<SuccessType>[]
): Promise<{ successList: SuccessType[]; rejectList: RejectType[] }> {
  const accumulator = {
    successList: [] as SuccessType[],
    rejectList: [] as RejectType[],
  };

  return (await Promise.allSettled(promises)).reduce((accumulator, result) => {
    if (result.status === "rejected") {
      accumulator.rejectList.push(result.reason);
    } else {
      accumulator.successList.push(result.value);
    }

    return accumulator;
  }, accumulator);
}

export async function createFunctionManifest(
  configPath: string,
  stage: FunctionStage
): Promise<FunctionManifest> {
  const [config, deployedFns] = await Promise.all([
    parseConfigFile(join(process.cwd(), configPath)),
    listFunctions(stage),
  ]);

  logger.printFunctionConfigList(config.functions);

  const configFns: FunctionInputs[] = Object.entries(config.functions).map(
    ([name, { runtime, description, handler }]) => ({
      name,
      description,
      code: parseHandlerCode(handler),
      runtime: runtime ?? config.defaultRuntime,
    })
  );

  logger.info("Configurations loaded.");

  return {
    functionInputs: configFns,
    deployedFunctions: deployedFns,
  };
}

export async function settleAndPrintFunctionResults(
  messages: { success: string; fail: string },
  resultsPromise: Promise<FunctionResult>[]
) {
  const { successList, rejectList } = await settlePromises<
    FunctionResult,
    FunctionResultError
  >(resultsPromise);

  if (successList?.[0]) {
    printFunctionResultList(messages.success, successList);
  }

  if (rejectList?.[0]) {
    printFunctionResultErrorList(messages.fail, rejectList);
  }
}

export function printFunctionResultList(
  message: string,
  results: FunctionResult[]
) {
  new LogBuilder({
    color: "yellow",
    message: `\n${message}:`,
  })
    .break(2)
    .list(
      results.map(({ summary, eTag }) => ({
        message: summary.Name,
        color: "cyan",
        children: [
          {
            bullet: "->",
            message: `${summary.FunctionMetadata.FunctionARN} [${summary.FunctionMetadata.Stage}] [${eTag}]`,
            color: "greenBright",
          },
        ],
      }))
    )
    .log();
}

export function printFunctionResultErrorList(
  message: string,
  errors: FunctionResultError[]
) {
  new LogBuilder({
    color: "red",
    message: `\n${message}:`,
  })
    .break(2)
    .list(
      errors.map(({ functionInputs, error }) => ({
        message: functionInputs.name,
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

export async function createAssociationManifest(
  functionConfigMap: FunctionConfigMap,
  deployedFunctions: FunctionSummary[],
  failOnDistributionNotFound = true
): Promise<AssociationManifest> {
  const manifest: AssociationManifest = {};
  const distributions = await getAssociatedDistributions(
    functionConfigMap,
    failOnDistributionNotFound
  );

  if (failOnDistributionNotFound) {
    assertFunctionDistributionCompatibility(functionConfigMap, distributions);
  }

  for (const functionName in functionConfigMap) {
    const { associations } = functionConfigMap[functionName];

    for (const association of associations) {
      {
        const { behaviourPattern, distributionId, eventType } = association;
        const deployedFunction = findFunction(functionName, deployedFunctions);

        if (!failOnDistributionNotFound && !distributions[distributionId]) {
          continue;
        }

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
  functionConfigs: FunctionConfigMap,
  failOnDistributionNotFound: boolean
): Promise<{ [distId: string]: DistributionResult }> {
  const distributions = await Promise.all(
    Object.values(functionConfigs).flatMap(({ associations }) =>
      associations.map(async ({ distributionId }) => {
        try {
          return await fetchDistribution(distributionId);
        } catch (error) {
          if (
            error.name !== CloudFrontError.DISTRIBUTION_NOT_FOUND ||
            failOnDistributionNotFound
          ) {
            throw error;
          }

          logger.warn(
            `Distribution ${distributionId} not found, skipping associations.`
          );
        }
      })
    )
  );

  return distributions.reduce(
    (accumulator: { [distId: string]: DistributionResult }, distribution) => {
      if (!!distribution && !accumulator[distribution.id]) {
        accumulator[distribution.id] = distribution;
      }

      return accumulator;
    },
    {}
  );
}

function assertFunctionDistributionCompatibility(
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

export function findBehaviour(
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

export function doesAssociationExist(
  association: FunctionAssociation,
  associations: FunctionAssociations | undefined
): boolean {
  return !!associations?.Items?.find(
    (a) =>
      a.FunctionARN === association.FunctionARN &&
      a.EventType === association.EventType
  );
}

export function haveAssociationsChanged(
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

export async function pollDistributionsForDeployedStatus(
  distAssociationMap: AssociationManifest
): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(
    Object.values(distAssociationMap).map(async ({ distribution }) =>
      pollDistributionForDeployedStatus(distribution)
    )
  );
}

async function pollDistributionForDeployedStatus(
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
