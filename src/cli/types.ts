import { FunctionInputs } from "../aws/index.js";

export interface DefaultArgs {
  config: string;
}

export interface FnError {
  fn: FunctionInputs;
  error: Error;
}
