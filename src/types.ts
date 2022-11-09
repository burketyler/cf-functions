import type { FunctionRuntime } from "aws-sdk/clients/cloudfront.js";

import { FunctionEventType } from "./aws/index.js";

export interface Config {
  functions: {
    [functionName: string]: FunctionConfig;
  };
  defaultRuntime?: FunctionRuntime;
  pathPrefix?: string;
}

export interface FunctionConfig {
  handler: string;
  runtime: FunctionRuntime;
  associations: FunctionAssociation[];
  isEnabled?: boolean;
  description?: string;
}

export interface FunctionAssociation {
  distributionId: string;
  eventType: FunctionEventType;
}
