import AWS from "aws-sdk";
import { DistributionConfig } from "aws-sdk/clients/cloudfront.js";
import { PromiseResult } from "aws-sdk/lib/request.js";

import { logger } from "../../../logging/index.js";
import { executeAwsRequest } from "../../utils.js";

import { DistributionResult } from "./types.js";

const cf = new AWS.CloudFront();

export async function fetchDistribution(
  id: string
): Promise<DistributionResult> {
  const result = await executeAwsRequest(
    cf.getDistributionConfig({ Id: id }).promise()
  );

  return parseDistributionResult(id, result);
}

export async function fetchDistributionStatus(id: string): Promise<string> {
  const result = await executeAwsRequest(
    cf.getDistribution({ Id: id }).promise()
  );

  if (!result.Distribution?.Status) {
    logger.fatal(`Status not returned while fetching distribution ${id}.`);
    process.exit(1);
  }

  return result.Distribution.Status;
}

export async function updateDistribution(
  distribution: DistributionResult
): Promise<DistributionResult> {
  const { id: Id, config: DistributionConfig, eTag: IfMatch } = distribution;

  const result = await executeAwsRequest(
    cf.updateDistribution({ Id, DistributionConfig, IfMatch }).promise()
  );

  return parseDistributionResult(Id, result);
}

function parseDistributionResult(
  id: string,
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
    logger.fatal(
      `Expected fields ${missingFields.join(", ")} not returned by CloudFront.`
    );
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { id, config: result.DistributionConfig!, eTag: result.ETag! };
}
