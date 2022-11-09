import { existsSync, readFileSync } from "fs";
import { join } from "path";

import {
  FunctionInputs,
  FunctionResult,
  FunctionStage,
  listFunctions,
} from "../aws/index.js";
import { logger } from "../logging/index.js";
import { configSchema } from "../schemas.js";
import { Config } from "../types.js";

import { printRejected, printSuccessList } from "./commands/stage/utils.js";
import { FnError } from "./types.js";

export async function getFunctionManifest(
  configPath: string,
  stage: FunctionStage
): Promise<{
  configFns: FunctionInputs[];
  deployedFns: Awaited<ReturnType<typeof listFunctions>>;
}> {
  const config = await parseConfigFile(join(process.cwd(), configPath));

  logger.printFunctionList(config.functions);

  const liveFns = await listFunctions(stage);

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
    configFns,
    deployedFns: liveFns,
  };
}

export async function settleAndPrintResults(
  messages: { success: string; fail: string },
  resultsPromise: Promise<FunctionResult>[]
) {
  const { successList, rejectList } = await settlePromises<
    FunctionResult,
    FnError
  >(resultsPromise);

  if (successList?.[0]) {
    printSuccessList(messages.success, successList);
  }

  if (rejectList?.[0]) {
    printRejected(messages.fail, rejectList);
  }
}

export function parseHandlerCode(path: string): string {
  assertFileExists(path, "Failed to locate function handler.");

  return readFileSync(path, "utf-8");
}

export async function parseConfigFile(path: string): Promise<Config> {
  logger.info("Loading function configuration.");

  assertFileExists(path, "Failed to locate configuration.");

  const config: Config = (await import(path))?.default;

  if (!config) {
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

function assertFileExists(path: string, errorMessage: string): void {
  const fileExists = existsSync(path);

  if (!fileExists) {
    logger.fatal(errorMessage, `File: '${path}'`);
    process.exit(1);
  }
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
