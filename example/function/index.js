function handler(event) {
  if (event.request.uri === "/index.html") {
    event.request.uri = "/test.html";
  }

  return event.request;
}
