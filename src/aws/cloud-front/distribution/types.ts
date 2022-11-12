import { DistributionConfig } from "aws-sdk/clients/cloudfront.js";

export interface DistributionResult {
  id: string;
  eTag: string;
  config: DistributionConfig;
}

export enum DistributionEventType {
  VIEWER_REQUEST = "viewer-request",
  VIEWER_RESPONSE = "viewer-response",
}
