import { CommandBuilder } from "yargs";

export const DEFAULT_ARGS: CommandBuilder = {
  c: {
    alias: "config",
    default: "./cf-functions.js",
    describe: "Path to the cf-functions configuration file.",
    type: "string",
  },
};
