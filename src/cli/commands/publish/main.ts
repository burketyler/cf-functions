import ora from "ora";
import { CommandBuilder, CommandModule } from "yargs";

import {
  describeFunction,
  FunctionStage,
  publishFunction,
} from "../../../aws/index.js";
import { logger } from "../../../logging/index.js";
import { DEFAULT_ARGS } from "../../constants.js";
import { FnError } from "../../types.js";
import { getFunctionManifest, settleAndPrintResults } from "../../utils.js";

import { PublishArgs } from "./types.js";

const command = "publish";

const desc =
  "Publish functions, copying them from the 'DEVELOPMENT' stage to the 'LIVE' stage.";

const builder: CommandBuilder = {
  ...DEFAULT_ARGS,
};

const handler = async (args: PublishArgs) => {
  logger.info("Starting command 'publish'.");

  const { configFns, deployedFns } = await getFunctionManifest(
    args.config,
    FunctionStage.DEVELOPMENT
  );

  logger.info(
    `Publishing ${configFns.length} functions from ${FunctionStage.DEVELOPMENT} to ${FunctionStage.LIVE}:\n`
  );

  const resultsPromise = configFns.map(async (fn) => {
    const progress = ora({
      indent: 2,
      text: `Publishing ${fn.name}...`,
    }).start();

    const liveFn = deployedFns.find((depFn) => depFn.Name === fn.name);

    if (!liveFn) {
      throw {
        fn,
        error: new Error(
          `Function is not staged in ${FunctionStage.DEVELOPMENT}.`
        ),
      };
    }

    try {
      const { eTag } = await describeFunction(
        fn.name,
        FunctionStage.DEVELOPMENT
      );

      const result = await publishFunction(liveFn.Name, eTag);

      progress.succeed(`Published ${liveFn.Name}`);

      return { ...result, eTag };
    } catch (error) {
      progress.fail(`Failed ${fn.name}.`);

      throw { fn, error } as FnError;
    }
  });

  await settleAndPrintResults(
    {
      success: "Successfully published functions",
      fail: "Failed to published functions",
    },
    resultsPromise
  );

  logger.info("Finishing command 'publish'.");
};

export default {
  command,
  desc,
  builder,
  handler,
} as CommandModule<{}, PublishArgs>; // eslint-disable-line @typescript-eslint/ban-types
