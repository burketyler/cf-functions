import type { FunctionRuntime } from "aws-sdk/clients/cloudfront.js";

import { DistributionEventType } from "./aws/index.js";

export interface Config {
  functions: FunctionConfigMap;
  defaultRuntime?: FunctionRuntime;
  pathPrefix?: string;
}

export interface FunctionConfigMap {
  [functionName: string]: FunctionConfig;
}

export interface FunctionConfig {
  handler: string;
  test?: string;
  runtime: FunctionRuntime;
  associations: FunctionAssociationConfig[];
  isEnabled?: boolean;
  description?: string;
}

export interface FunctionAssociationConfig {
  distributionId: string;
  eventType: DistributionEventType;
  behaviourPattern: BehaviourPattern;
}

export type BehaviourPattern = "default" | string;
