#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { associate } from "./commands/associate/index.js";
import { publish } from "./commands/publish/index.js";
import { stage } from "./commands/stage/index.js";

yargs(hideBin(process.argv))
  .command(stage)
  .command(publish)
  .command(associate)
  .showHelpOnFail(false, "Specify --help for available options").argv;
