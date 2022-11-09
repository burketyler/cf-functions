import { AWSError } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request.js";

export async function executeAwsRequest<T>(
  request: Promise<PromiseResult<T, AWSError>>
): Promise<PromiseResult<T, AWSError>> {
  const result = await request;

  validatePromiseResult<T>(result);

  return result;
}

function validatePromiseResult<T>(
  promiseResult: PromiseResult<T, AWSError>
): void {
  if (promiseResult.$response.error) {
    throw promiseResult.$response.error;
  }
}
