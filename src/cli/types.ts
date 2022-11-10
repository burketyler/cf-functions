import { FunctionInputs } from "../aws/index.js";

export interface DefaultArgs {
  config: string;
}

export interface FunctionResultError {
  functionInputs: FunctionInputs;
  error: Error;
}
