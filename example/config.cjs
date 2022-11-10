module.exports = {
  defaultRuntime: "cloudfront-js-1.0",
  functions: {
    RewritePath: {
      handler: "./example/function.js",
      description: "This is a test function",
      associations: [
        {
          distributionId: "EI4P7GWH7VF6P",
          eventType: "viewer-request",
          behaviourPattern: "_next/static/*",
        },
      ],
    },
  },
};
