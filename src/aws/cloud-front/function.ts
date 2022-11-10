import AWS from "aws-sdk";
import { FunctionSummary } from "aws-sdk/clients/cloudfront.js";
import { PromiseResult } from "aws-sdk/lib/request.js";

import { executeAwsRequest } from "../utils.js";

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
  etag: string
): Promise<FunctionResult> {
  const result = await executeAwsRequest(
    cf
      .publishFunction({
        Name: name,
        IfMatch: etag,
      })
      .promise()
  );

  return parseFunctionResult({ ...result, ETag: "N/A" });
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
    throw new Error(
      `Expected fields ${missingFields.join(", ")} not returned by CloudFront.`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { summary: result.FunctionSummary!, eTag: result.ETag! };
}
