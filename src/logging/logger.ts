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
    printFunctionList,
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

function printFunctionList(fnList: { [fnName: string]: FunctionConfig }) {
  new LogBuilder()
    .break()
    .list(
      Object.entries(fnList).map(([fnName, config]) => ({
        message: fnName,
        color: "cyan",
        children: config.associations.map(
          ({ distributionId: id, eventType: type }) => ({
            message: `${id} [${type}]`,
            color: "greenBright",
          })
        ),
      }))
    )
    .log();
}
