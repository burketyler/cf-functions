import { FunctionEvent } from "../../../aws/index.js";

export const DEFAULT_EVENT_OBJECT: FunctionEvent = {
  version: "1.0",
  context: {
    distributionDomainName: "",
    distributionId: "",
    eventType: "",
    requestId: "",
  },
  viewer: {
    ip: "198.51.100.11",
  },
  request: {
    method: "",
    uri: "",
    querystring: {},
    headers: {},
    cookies: {},
  },
  response: {
    statusCode: 200,
    statusDescription: "OK",
    headers: {},
    cookies: {},
  },
};
