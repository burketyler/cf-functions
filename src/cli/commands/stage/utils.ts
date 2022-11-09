import { FunctionResult } from "../../../aws/index.js";
import { LogBuilder } from "../../../logging/builder.js";
import { FnError } from "../../types.js";

export function printSuccessList(
  message: string,
  successList: FunctionResult[]
) {
  new LogBuilder({
    color: "yellow",
    message: `\n${message}:`,
  })
    .break(2)
    .list(
      successList.map(({ summary, eTag }) => ({
        message: summary.Name,
        color: "cyan",
        children: [
          {
            bullet: "->",
            message: `${summary.FunctionMetadata.FunctionARN} [${summary.FunctionMetadata.Stage}] [${eTag}]`,
            color: "greenBright",
          },
        ],
      }))
    )
    .log();
}

export function printRejected(message: string, rejectList: FnError[]) {
  new LogBuilder({
    color: "red",
    message: `\n${message}:`,
  })
    .break(2)
    .list(
      rejectList.map(({ fn, error }) => ({
        message: fn.name,
        children: [
          {
            bullet: "",
            message: error.name,
            children: [
              {
                bullet: "",
                message: error.message,
                children: [{ bullet: "", message: error.stack ?? "N/A" }],
              },
            ],
          },
        ],
      }))
    )
    .log();
}
