import { FunctionSummary } from "aws-sdk/clients/cloudfront.js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import {
  FunctionInputs,
  FunctionResult,
  FunctionStage,
  listFunctions,
} from "../aws/index.js";
import { LogBuilder } from "../logging/builder.js";
import { logger } from "../logging/index.js";
import { configSchema } from "../schemas.js";
import { Config } from "../types.js";

import { FunctionManifest, FunctionResultError } from "./types.js";

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

export async function getFunctionManifest(
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
    deployedFns: deployedFns,
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
