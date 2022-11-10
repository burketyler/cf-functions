import chalk from "chalk";
import { write } from "fs";

import { FunctionConfig } from "../types.js";

import { LogBuilder } from "./builder.js";

export function createLogger() {
  return {
    log,
    info,
    error,
    fatal,
    printFunctionConfigList,
  };
}

function log(loggable: LogBuilder | string) {
  console.log(typeof loggable === "string" ? loggable : loggable.build());
}

function fatal(...messages: string[]) {
  new LogBuilder({
    color: "yellow",
    breaks: 2,
  })
    .break(1)
    .write("*******************")
    .write(" Error ", "red")
    .write("********************")
    .break()
    .list(
      messages.map((message, index) => ({
        message,
        bullet: "",
        color: "red",
        indent: index + 1,
      }))
    )
    .line("**********************************************")
    .break(1)
    .log();
}

function error(msg: string, error?: Error) {
  console.log(chalk.red(msg));
  console.log(" " + chalk.red(error?.name));
  console.log("  " + chalk.red(error?.message));
  console.log("   " + chalk.red(error?.stack));
}

function info(msg: string) {
  console.log(chalk.yellow(msg));
}

function printFunctionConfigList(functionConfigMap: {
  [functionName: string]: FunctionConfig;
}) {
  new LogBuilder()
    .break()
    .list(
      Object.entries(functionConfigMap).map(([fnName, config]) => ({
        message: fnName,
        color: "cyan",
        children: config.associations.map(
          ({ distributionId: id, behaviourPattern, eventType }) => ({
            bullet: "numbered",
            message: `${id} (Pattern: ${behaviourPattern}) [Event: ${eventType}]`,
            color: "greenBright",
          })
        ),
      }))
    )
    .log();
}
