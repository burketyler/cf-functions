export { getDistributionConfig, updateDistribution } from "./distribution.js";
export {
  listFunctions,
  updateFunction,
  createFunction,
  deleteFunction,
  describeFunction,
  publishFunction,
} from "./function.js";
export { FunctionRuntime, FunctionEventType, FunctionStage } from "./types.js";

export type { FunctionInputs, FunctionResult } from "./types.js";
