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
import { DEFAULT_ARGS } from "../../consts.js";
import { FunctionResultError } from "../../types.js";
import {
  createFunctionManifest,
  settleAndPrintFunctionResults,
} from "../../utils.js";

import { StageArgs } from "./types.js";

const command = "stage";

const desc = "Deploy functions to the 'DEVELOPMENT' stage.";

const builder: CommandBuilder = {
  ...DEFAULT_ARGS,
};

const handler = async (args: StageArgs) => {
  const stage = FunctionStage.DEVELOPMENT;

  logger.info("Starting command 'stage'.");

  const { functionInputs, deployedFunctions } = await createFunctionManifest(
    args.config,
    stage
  );

  logger.info(`Staging ${functionInputs.length} functions in ${stage}:\n`);

  const resultsPromise = functionInputs.map(async (functionInputs) => {
    const progress = ora({
      indent: 2,
      text: `Deploying ${functionInputs.name}`,
    }).start();

    try {
      let result: FunctionResult;

      const liveFn = deployedFunctions.find(
        (df) => df.Name === functionInputs.name
      );

      if (liveFn) {
        const { eTag } = await describeFunction(functionInputs.name, stage);

        result = await updateFunction(functionInputs, eTag);

        progress.succeed(`Staged ${functionInputs.name}.`);

        return result;
      } else {
        result = await createFunction(functionInputs);

        progress.succeed(`Staged ${functionInputs.name}.`);

        return result;
      }
    } catch (error) {
      progress.fail(`Failed ${functionInputs.name}.`);

      throw { functionInputs, error } as FunctionResultError;
    }
  });

  await settleAndPrintFunctionResults(
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
