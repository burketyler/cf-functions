#!/usr/bin/env ts-node-esm
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { associate } from "./commands/associate/index.js";
import { destroy } from "./commands/destroy/index.js";
import { publish } from "./commands/publish/index.js";
import { stage } from "./commands/stage/index.js";
import { test } from "./commands/test/index.js";
import { createCommand } from "./utils.js";

const instance = yargs(hideBin(process.argv));

[stage, publish, associate, test, destroy].forEach((cmd) =>
  //TODO: fix this
  instance.command(createCommand(cmd as any))
);

instance.showHelpOnFail(false, "Specify --help for available options").argv;
