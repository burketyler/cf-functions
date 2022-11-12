import { FunctionSummary } from "aws-sdk/clients/cloudfront.js";

export interface FunctionInputs {
  name: string;
  code: string;
  description?: string;
  runtime?: string;
}

export interface FunctionResult {
  eTag: string;
  summary: FunctionSummary;
}

export enum FunctionStage {
  DEVELOPMENT = "DEVELOPMENT",
  LIVE = "LIVE",
}

export enum FunctionRuntime {
  "JS_1.0" = "cloudfront-js-1.0",
}
