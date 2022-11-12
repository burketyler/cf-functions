import { TestResult } from "aws-sdk/clients/cloudfront.js";

import { FunctionStage } from "../../../aws/index.js";
import { DefaultArgs } from "../../types.js";

export interface TestResultMap {
  [functionName: string]: TestCaseResult[];
}

export interface TestCaseResult extends TestResult, TestCase {
  isSuccess: boolean;
  error?: Error;
}

export interface TestError {
  functionName: string;
  error: Error;
}

export interface TestArgs extends DefaultArgs {
  stage: FunctionStage;
}

export type TestCase = {
  name: string;
  given: ViewerRequestTestObject | ViewerResponseTestObject;
  expect: EventObject;
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export interface ViewerRequestTestObject extends DeepPartial<EventObject> {
  request: Partial<Request> & {
    method: string;
    uri: string;
  };
}

export interface ViewerResponseTestObject extends DeepPartial<EventObject> {
  request: Partial<Request> & {
    method: string;
    uri: string;
  };
  response: Partial<Response> & {
    statusCode: number;
    statusDescription: string;
  };
}

export interface EventObject {
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
  request: Request;
  response?: Response;
}

interface Request {
  method: string;
  uri: string;
  querystring: MultiValueMap;
  headers: MultiValueMap;
  cookies: MultiValueMap;
}

type MultiValueMap = {
  [name: string]: { value: string; multiValue?: { value: string }[] };
};

interface Response {
  statusCode: number;
  statusDescription: string;
  headers: ResponseHeader;
  cookies: ResponseCookie;
}

type ResponseHeader = {
  [headerName: string]: { value: string };
};

type ResponseCookie = {
  [cookieName: string]: {
    value: string;
    attributes: string;
    multiValue?: { value: string; attributes: string }[];
  };
};
