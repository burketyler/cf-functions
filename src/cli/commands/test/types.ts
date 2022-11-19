import { TestResult } from "aws-sdk/clients/cloudfront.js";

import {
  FunctionEvent,
  FunctionEventRequest,
  FunctionEventResponse,
  FunctionStage,
} from "../../../aws/index.js";
import { DefaultArgs } from "../../types.js";

export interface TestArgs extends DefaultArgs {
  stage: FunctionStage;
}

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

export type TestCase = {
  name: string;
  given: ViewerRequestTestObject | ViewerResponseTestObject;
  expect: FunctionEvent;
};

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export interface ViewerRequestTestObject extends DeepPartial<FunctionEvent> {
  request: Partial<FunctionEventRequest> & {
    method: string;
    uri: string;
  };
}

export interface ViewerResponseTestObject extends DeepPartial<FunctionEvent> {
  request: Partial<FunctionEventRequest> & {
    method: string;
    uri: string;
  };
  response: Partial<FunctionEventResponse> & {
    statusCode: number;
    statusDescription: string;
  };
}
