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

export interface FunctionEvent {
  version: string;
  context: {
    distributionDomainName: string;
    distributionId: string;
    eventType: string;
    requestId: string;
  };
  viewer: {
    ip: string;
  };
  request: FunctionEventRequest;
  response?: FunctionEventResponse;
}

export interface FunctionEventRequest {
  method: Readonly<string>;
  uri: string;
  querystring: MultiValueMap;
  headers: MultiValueMap;
  cookies: MultiValueMap;
}

export type MultiValueMap = {
  [name: string]: { value: string; multiValue?: { value: string }[] };
};

export interface FunctionEventResponse {
  statusCode: number;
  statusDescription: string;
  headers: ResponseHeader;
  cookies: ResponseCookie;
}

export type ResponseHeader = {
  [headerName: string]: { value: string };
};

export type ResponseCookie = {
  [cookieName: string]: {
    value: string;
    attributes: string;
    multiValue?: { value: string; attributes: string }[];
  };
};

export type HandlerReturn =
  | (FunctionEventRequest & {
      querystring?: MultiValueMap;
      headers?: MultiValueMap;
      cookies?: MultiValueMap;
    })
  | (FunctionEventResponse & {
      statusDescription?: string;
      headers?: ResponseHeader;
      cookies?: ResponseCookie;
    });
