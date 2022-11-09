import AWS from "aws-sdk";
import { DistributionConfig } from "aws-sdk/clients/cloudfront.js";
import { PromiseResult } from "aws-sdk/lib/request.js";

import { executeAwsRequest } from "../utils.js";

import { DistributionResult } from "./types.js";

const cf = new AWS.CloudFront();

export async function getDistributionConfig(
  id: string
): Promise<DistributionResult> {
  const result = await executeAwsRequest(
    cf.getDistributionConfig({ Id: id }).promise()
  );

  return parseDistributionResult(result);
}

export async function updateDistribution(
  id: string,
  config: DistributionConfig
): Promise<DistributionResult> {
  const result = await executeAwsRequest(
    cf.updateDistribution({ Id: id, DistributionConfig: config }).promise()
  );

  return parseDistributionResult(result);
}

function parseDistributionResult(
  result: PromiseResult<
    { DistributionConfig?: DistributionConfig; ETag?: string },
    AWS.AWSError
  >
): DistributionResult {
  const missingFields: string[] = [];

  if (!result.DistributionConfig) {
    missingFields.push("DistributionConfig");
  } else if (!result.ETag) {
    missingFields.push("ETag");
  }

  if (missingFields?.[0]) {
    throw new Error(
      `Expected fields ${missingFields.join(", ")} not returned by CloudFront.`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { config: result.DistributionConfig!, eTag: result.ETag! };
}
