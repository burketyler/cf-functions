import { FunctionResult } from "../../../aws/index.js";
import { LogBuilder } from "../../../logging/builder.js";
import { FunctionResultError } from "../../types.js";

export function printFunctionResultList(
  message: string,
  results: FunctionResult[]
) {
  new LogBuilder({
    color: "yellow",
    message: `\n${message}:`,
  })
    .break(2)
    .list(
      results.map(({ summary, eTag }) => ({
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

export function printFunctionResultErrorList(
  message: string,
  errors: FunctionResultError[]
) {
  new LogBuilder({
    color: "red",
    message: `\n${message}:`,
  })
    .break(2)
    .list(
      errors.map(({ functionInputs, error }) => ({
        message: functionInputs.name,
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
