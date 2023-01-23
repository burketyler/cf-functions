import { FunctionEvent, HandlerReturn } from "cf-functions";

var isRootIndexRegex = /^\/(index\.html)?$/i;
var viewerCountryHeader = "cloudfront-viewer-country";

function handler(event: FunctionEvent): HandlerReturn {
  var countryCode;
  var request = event.request;
  var headers = request.headers;

  if (!request.uri.toLowerCase().match(isRootIndexRegex)) {
    return request;
  }

  if (headers[viewerCountryHeader]) {
    countryCode = headers[viewerCountryHeader].value;
  }

  var redirectUrl = getRedirectUrl(
    countryCode as ViewerCountry
  );

  if (redirectUrl) {
    return {
      statusCode: 302,
      statusDescription: "Found",
      headers: { location: { value: redirectUrl } },
    };
  }

  return request;
}

function getRedirectUrl(viewerCountry: ViewerCountry | undefined) {
  if (!viewerCountry) {
    return;
  }

  switch (viewerCountry.toUpperCase()) {
    case ViewerCountry.UNITED_STATES:
      return "https://mywebsite.com";
    case ViewerCountry.JAPAN:
      return "https://mywebsite.jp";
    case ViewerCountry.UNITED_KINGDOM:
      return "https://mywebsite.co.uk";
  }
}

enum ViewerCountry {
  UNITED_STATES = "US",
  UNITED_KINGDOM = "GB",
  JAPAN = "JP",
}
