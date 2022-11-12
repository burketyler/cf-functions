const testCase1 = {
  name: "When the path is /index.html, Then path is converted to /test.html",
  given: {
    request: {
      method: "GET",
      uri: "/index.html",
    },
  },
  expect: {
    request: {
      method: "GET",
      uri: "/test.html",
    },
  },
};

const testCase2 = {
  name: "When the path is NOT /index.html, Then path is converted to NOT /test.html",
  given: {
    request: {
      method: "GET",
      uri: "/another.html",
    },
  },
  expect: {
    request: {
      method: "GET",
      uri: "/another.html",
    },
  },
};

const testCase3 = {
  name: "When the case is next, Then path is also next",
  given: {
    request: {
      method: "GET",
      uri: "/index.html",
    },
  },
  expect: {
    request: {
      method: "GET",
      uri: "/test.html",
    },
  },
};

export default [testCase1, testCase2, testCase3];
