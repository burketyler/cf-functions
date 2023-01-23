import { FunctionEvent, HandlerReturn } from "cf-functions";

function handler(event: FunctionEvent): HandlerReturn {
    var headers = event.request.headers;

    headers["x-custom-header"] = { value: "Cool beans!" };

    return event.request;
}
