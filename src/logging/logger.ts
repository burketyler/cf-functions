import chalk from "chalk";

import { FunctionConfig } from "../types.js";

import { LogBuilder } from "./builder.js";

export function createLogger() {
  return {
    log,
    info,
    warn,
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

function error(message: string, error?: Error) {
  const builder = new LogBuilder({
    message,
    color: "red",
  });

  if (error) {
    builder.setIndent(1).line(error.name).setIndent(2).line(error.message);

    if (error.stack) {
      builder.setIndent(3).line(error.stack);
    }
  }

  builder.log();
}

function info(msg: string) {
  console.log(chalk.yellow(msg));
}

function warn(msg: string) {
  console.log(chalk.yellowBright(msg));
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
