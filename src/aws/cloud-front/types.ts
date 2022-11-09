import {
  DistributionConfig,
  FunctionSummary,
} from "aws-sdk/clients/cloudfront.js";

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

export interface DistributionResult {
  eTag: string;
  config: DistributionConfig;
}

export enum FunctionStage {
  DEVELOPMENT = "DEVELOPMENT",
  LIVE = "LIVE",
}

export enum FunctionRuntime {
  "1.0" = "cloudfront-js-1.0",
}

export enum FunctionEventType {
  VIEWER_REQUEST = "viewer-request",
  VIEWER_RESPONSE = "viewer-response",
}
