import AWS from "aws-sdk";
import { FunctionSummary, TestResult } from "aws-sdk/clients/cloudfront.js";
import { PromiseResult } from "aws-sdk/lib/request.js";

import { logger } from "../../../logging/index.js";
import { executeAwsRequest } from "../../utils.js";

import { DEFAULT_DESCR, DEFAULT_RUNTIME } from "./constants.js";
import { FunctionInputs, FunctionResult, FunctionStage } from "./types.js";

const cf = new AWS.CloudFront();

export async function listFunctions(
  stage: FunctionStage
): Promise<FunctionSummary[]> {
  let marker: string | undefined;

  const functionList: FunctionSummary[] = [];

  do {
    const result = await executeAwsRequest(
      cf.listFunctions({ Stage: stage, Marker: marker }).promise()
    );

    if (result.FunctionList?.Items) {
      functionList.push(...result.FunctionList.Items);
    }

    marker = result.FunctionList?.NextMarker;
  } while (marker);

  return functionList;
}

export async function describeFunction(
  name: string,
  stage?: FunctionStage
): Promise<FunctionResult> {
  const result = await executeAwsRequest(
    cf.describeFunction({ Name: name, Stage: stage }).promise()
  );

  return parseFunctionResult(result);
}

export async function createFunction(
  _function: FunctionInputs
): Promise<FunctionResult> {
  const result = await executeAwsRequest(
    cf
      .createFunction({
        Name: _function.name,
        FunctionConfig: {
          Runtime: _function.runtime ?? DEFAULT_RUNTIME,
          Comment: _function.description ?? DEFAULT_DESCR,
        },
        FunctionCode: _function.code,
      })
      .promise()
  );

  return parseFunctionResult(result);
}

export async function updateFunction(
  _function: FunctionInputs,
  etag: string
): Promise<FunctionResult> {
  const result = await executeAwsRequest(
    cf
      .updateFunction({
        IfMatch: etag,
        Name: _function.name,
        FunctionConfig: {
          Runtime: _function.runtime ?? DEFAULT_RUNTIME,
          Comment: _function.description ?? DEFAULT_DESCR,
        },
        FunctionCode: _function.code,
      })
      .promise()
  );

  return parseFunctionResult(result);
}

export async function deleteFunction(
  name: string,
  etag: string
): Promise<void> {
  await executeAwsRequest(
    cf
      .deleteFunction({
        Name: name,
        IfMatch: etag,
      })
      .promise()
  );
}

export async function publishFunction(
  name: string,
  eTag: string
): Promise<FunctionResult> {
  const result = await executeAwsRequest(
    cf
      .publishFunction({
        Name: name,
        IfMatch: eTag,
      })
      .promise()
  );

  return parseFunctionResult({ ...result, ETag: "N/A" });
}

export async function testFunction(inputs: {
  name: string;
  stage: FunctionStage;
  eTag: string;
  eventObject: string;
}): Promise<TestResult> {
  const {
    name: Name,
    stage: Stage,
    eTag: IfMatch,
    eventObject: EventObject,
  } = inputs;

  const result = await executeAwsRequest(
    cf
      .testFunction({
        Name,
        EventObject,
        Stage,
        IfMatch,
      })
      .promise()
  );

  if (!result.TestResult) {
    logger.fatal(
      `CloudFront didn't return a 'TestResult' for function '${Name}'.`
    );
    process.exit(1);
  }

  return result.TestResult;
}

function parseFunctionResult(
  result: PromiseResult<
    { FunctionSummary?: FunctionSummary; ETag?: string },
    AWS.AWSError
  >
): FunctionResult {
  const missingFields: string[] = [];

  if (!result.FunctionSummary) {
    missingFields.push("FunctionSummary");
  } else if (!result.ETag) {
    missingFields.push("ETag");
  }

  if (missingFields?.[0]) {
    logger.fatal(
      `Expected fields ${missingFields.join(", ")} not returned by CloudFront.`
    );
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { summary: result.FunctionSummary!, eTag: result.ETag! };
}
