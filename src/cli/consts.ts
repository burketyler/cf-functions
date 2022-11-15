import { CommandBuilder } from "yargs";

export const DEFAULT_ARGS: CommandBuilder = {
  env: {
    alias: "e",
    describe: "Dotenv environment file to use, e.g. .env.{env}.",
    type: "string",
  },
  config: {
    alias: "c",
    default: "./cf-functions.js",
    describe: "Path to the cf-functions configuration file.",
    type: "string",
  },
};
