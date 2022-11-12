import { FunctionInputs, listFunctions } from "../aws/index.js";

export interface DefaultArgs {
  config: string;
}

export interface FunctionResultError {
  functionInputs: FunctionInputs;
  error: Error;
}

export interface FunctionManifest {
  functionInputs: FunctionInputs[];
  deployedFns: Awaited<ReturnType<typeof listFunctions>>;
}
