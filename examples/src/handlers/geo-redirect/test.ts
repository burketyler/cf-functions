const US_REDIRECT_URL =
    "https://mywebsite.com";
const JP_REDIRECT_URL =
    "https://mywebsite.jp";
const GB_REDIRECT_URL =
    "https://mywebsite.co.uk";

const redirectCases = [
    {country: "US", location: US_REDIRECT_URL},
    {country: "JP", location: JP_REDIRECT_URL},
    {country: "GB", location: GB_REDIRECT_URL},
].map(({country, location}) => ({
    name: `When origin country is ${country}, Then redirect returned to ${location}.`,
    given: {
        request: {
            method: "GET",
            uri: "/",
            headers: {
                "cloudfront-viewer-country": {
                    value: country,
                },
            },
        },
    },
    expect: {
        response: {
            statusCode: 302,
            headers: {
                location: {
                    value: location,
                },
            },
        },
    },
}));

const passThroughCases = ["AU", undefined].map((country) => {
    const request = {
        request: {
            method: "GET",
            uri: "/",
            headers: country
                ? {
                    "cloudfront-viewer-country": {
                        value: country,
                    },
                }
                : {},
        },
    };

    return {
        name: `When origin country is ${country}, Then no changes made to request.`,
        given: request,
        expect: request,
    };
});

const indexPageCases = ["/", "/index.html"].map((uri) => {
    const request = {
        request: {
            method: "GET",
            uri,
            headers: {
                "cloudfront-viewer-country": {
                    value: "US",
                },
            },
        },
    };

    return {
        name: `When country should redirect and URI path is the root index, Then redirect returned.`,
        given: request,
        expect: {
            response: {
                statusCode: 302,
                headers: {
                    location: {
                        value: US_REDIRECT_URL,
                    },
                },
            },
        },
    };
});

const nonIndexPageCases = ["/some/child", "/some/child/index.html"].map(
    (uri) => {
        const request = {
            request: {
                method: "GET",
                uri,
                headers: {
                    "cloudfront-viewer-country": {
                        value: "US",
                    },
                },
            },
        };

        return {
            name: `It should add x-custom-header with value 'Cool beans!'.`,
            given: {
                request: {
                    method: "GET",
                    uri: "https://mysite.com",
                    headers: {},
                },
            },
            expect: {
                request: {
                    method: "GET",
                    uri: "https://mysite.com",
                    headers: {
                        "x-custom-header": {
                            value: "Cool beans!",
                        },
                    },
                },
            },
        };
    }
);

export default [
    ...indexPageCases,
    ...nonIndexPageCases,
    ...redirectCases,
    ...passThroughCases,
];
