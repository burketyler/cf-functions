import { DefaultArgs } from "../../types.js";

export type DestroyArgs = DefaultArgs;

export interface DeleteResult {
  functionName: string;
}

export interface DeleteResultError {
  functionName: string;
  error: Error;
}
