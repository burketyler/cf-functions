#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { publish } from "./commands/publish/index.js";
import { stage } from "./commands/stage/index.js";

yargs(hideBin(process.argv))
  .command(stage)
  .command(publish)
  .showHelpOnFail(false, "Specify --help for available options").argv;
