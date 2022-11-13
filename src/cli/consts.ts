import { CommandBuilder } from "yargs";

export const DEFAULT_ARGS: CommandBuilder = {
  config: {
    alias: "c",
    default: "./cf-functions.js",
    describe: "Path to the cf-functions configuration file.",
    type: "string",
  },
};
