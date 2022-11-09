import ora from "ora";
import { CommandBuilder, CommandModule } from "yargs";

import {
  createFunction,
  describeFunction,
  FunctionResult,
  FunctionStage,
  updateFunction,
} from "../../../aws/index.js";
import { logger } from "../../../logging/index.js";
import { FnError } from "../../types.js";
import { getFunctionManifest, settleAndPrintResults } from "../../utils.js";

import { StageArgs } from "./types.js";

const command = "stage";

const desc = "Deploy functions to the 'DEVELOPMENT' stage.";

const builder: CommandBuilder = {
  c: {
    alias: "config",
    default: "./cf-functions.js",
    describe: "Path to the cf-functions configuration file.",
    type: "string",
  },
};

const handler = async (args: StageArgs) => {
  const stage = FunctionStage.DEVELOPMENT;

  logger.info("Starting command 'stage'.");

  const { configFns, deployedFns } = await getFunctionManifest(
    args.config,
    stage
  );

  logger.info(`Staging ${configFns.length} functions in ${stage}:\n`);

  const resultsPromise = configFns.map(async (fn) => {
    const progress = ora({
      indent: 2,
      text: `Deploying ${fn.name}...`,
    }).start();

    try {
      let result: FunctionResult;

      const liveFn = deployedFns.find((depFn) => depFn.Name === fn.name);

      if (liveFn) {
        const { eTag } = await describeFunction(fn.name, stage);

        result = await updateFunction(fn, eTag);

        progress.succeed(`Staged ${fn.name}.`);

        return result;
      } else {
        result = await createFunction(fn);

        progress.succeed(`Staged ${fn.name}.`);

        return result;
      }
    } catch (error) {
      progress.fail(`Failed ${fn.name}.`);

      throw { fn, error } as FnError;
    }
  });

  await settleAndPrintResults(
    {
      success: "Successfully staged functions",
      fail: "Failed to stage functions",
    },
    resultsPromise
  );

  logger.info("Finishing command 'stage'.");
};

export default {
  command,
  desc,
  builder,
  handler,
} as CommandModule<{}, StageArgs>; // eslint-disable-line @typescript-eslint/ban-types
