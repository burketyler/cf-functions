import { join } from "path";
import { CommandBuilder, CommandModule } from "yargs";

import { FunctionStage, listFunctions } from "../../../aws/index.js";
import { logger } from "../../../logging/index.js";
import { DEFAULT_ARGS } from "../../constants.js";
import { parseConfigFile } from "../../utils.js";

import { AssociateArgs } from "./types.js";
import {
  associateFunctionsWithDistribution,
  createAssociationManifest,
  pollDistributionForDeployedStatus,
  settleAndPrintAssociateResults,
} from "./utils.js";

const command = "associate";

const desc =
  "Associate functions in 'LIVE' stage with configured CloudFront distribution behaviours.";

const builder: CommandBuilder = {
  ...DEFAULT_ARGS,
};

const handler = async (args: AssociateArgs) => {
  logger.info("Starting command 'associate'.");

  const [config, deployedFunctions] = await Promise.all([
    parseConfigFile(join(process.cwd(), args.config)),
    listFunctions(FunctionStage.LIVE),
  ]);

  logger.printFunctionConfigList(config.functions);

  logger.info(`Associating functions with CloudFront Distributions:\n`);

  const distAssociationMap = await createAssociationManifest(
    config.functions,
    deployedFunctions
  );

  const associatePromises = Object.values(distAssociationMap).map(
    async ({ associations, distribution }) =>
      associateFunctionsWithDistribution(associations, distribution)
  );

  await settleAndPrintAssociateResults(associatePromises);

  await Promise.allSettled(
    Object.values(distAssociationMap).map(async ({ distribution }) =>
      pollDistributionForDeployedStatus(distribution)
    )
  );

  logger.info("Finishing command 'associate'.");
};

export default {
  command,
  desc,
  builder,
  handler,
} as CommandModule<{}, AssociateArgs>; // eslint-disable-line @typescript-eslint/ban-types
