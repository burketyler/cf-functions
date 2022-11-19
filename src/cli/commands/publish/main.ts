import ora from "ora";
import { CommandBuilder, CommandModule } from "yargs";

import {
  describeFunction,
  FunctionStage,
  publishFunction,
} from "../../../aws/index.js";
import { logger } from "../../../logging/index.js";
import { DEFAULT_ARGS } from "../../consts.js";
import { FunctionResultError } from "../../types.js";
import {
  findFunction,
  createFunctionManifest,
  settleAndPrintFunctionResults,
} from "../../utils.js";

import { PublishArgs } from "./types.js";

const command = "publish";

const desc =
  "Publish functions, copying them from the 'DEVELOPMENT' stage to the 'LIVE' stage.";

const builder: CommandBuilder = {
  ...DEFAULT_ARGS,
};

const handler = async (args: PublishArgs) => {
  logger.info("Starting command 'publish'.");

  const { functionInputs, deployedFunctions } = await createFunctionManifest(
    args.config,
    FunctionStage.DEVELOPMENT
  );

  logger.info(
    `Publishing ${functionInputs.length} functions from ${FunctionStage.DEVELOPMENT} to ${FunctionStage.LIVE}:\n`
  );

  const resultsPromise = functionInputs.map(async (fn) => {
    const progress = ora({
      indent: 2,
      text: `Publishing ${fn.name}`,
    }).start();

    try {
      const deployedFn = findFunction(fn.name, deployedFunctions);

      const { eTag } = await describeFunction(
        fn.name,
        FunctionStage.DEVELOPMENT
      );

      const result = await publishFunction(deployedFn.Name, eTag);

      progress.succeed(`Published ${deployedFn.Name}`);

      return { ...result, eTag };
    } catch (error) {
      progress.fail(`Failed ${fn.name}.`);

      throw { functionInputs: fn, error } as FunctionResultError;
    }
  });

  await settleAndPrintFunctionResults(
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
