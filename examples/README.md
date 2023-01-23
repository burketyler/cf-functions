## Getting started

`cp .env.example .env`

Populate `.env` with required environment variables. You can find the relevant values in the
CloudFront dashboard in AWS.

```shell
yarn install
```

## Functions

### AddHeader

Adds the x-custom-header to incoming requests.

### GeoRedirect

Attaches to a CloudFront Distribution, is responsible for redirecting
users based on their geographic location. The geographic location is inferred from the [cloudfront-viewer-country](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-cloudfront-headers.html)
header injected by CloudFront.
