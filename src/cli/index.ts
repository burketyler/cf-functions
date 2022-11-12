#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { associate } from "./commands/associate/index.js";
import { publish } from "./commands/publish/index.js";
import { stage } from "./commands/stage/index.js";
import { test } from "./commands/test/index.js";

yargs(hideBin(process.argv))
  .command(stage)
  .command(publish)
  .command(associate)
  .command(test)
  .showHelpOnFail(false, "Specify --help for available options").argv;
