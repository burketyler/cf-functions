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

export enum FunctionStage {
  DEVELOPMENT = "DEVELOPMENT",
  LIVE = "LIVE",
}

export enum FunctionRuntime {
  "1.0" = "cloudfront-js-1.0",
}

export interface DistributionResult {
  id: string;
  eTag: string;
  config: DistributionConfig;
}

export enum DistributionEventType {
  VIEWER_REQUEST = "viewer-request",
  VIEWER_RESPONSE = "viewer-response",
}
