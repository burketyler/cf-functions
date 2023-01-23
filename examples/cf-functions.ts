import { Config, DistributionEventType } from "cf-functions";

export const config: Config = {
  pathPrefix: "/src/handlers",
  defaultRuntime: "cloudfront-js-1.0",
  functions: {
    AddHeader: {
      handler: "/add-header/index.ts",
      test: "/add-header/test.ts",
      description:
          "Adds the x-custom-header HTTP header to request.",
      associations: [
        {
          distributionId: process.env.DISTRIBUTION_ID!,
          eventType: DistributionEventType.VIEWER_REQUEST,
          behaviourPattern: "default",
        },
      ],
    },
    GeoRedirect: {
      handler: "/geo-redirect/index.ts",
      test: "/geo-redirect/test.ts",
      description:
        "Route users to different page based on country of origin",
      associations: [
        {
          distributionId: process.env.DISTRIBUTION_ID!,
          eventType: DistributionEventType.VIEWER_REQUEST,
          behaviourPattern: "default",
        },
      ],
    },
  },
};

export default config;
