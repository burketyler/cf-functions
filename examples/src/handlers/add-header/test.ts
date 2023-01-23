export default [
    {
        name: `It should add x-custom-header with value 'Cool beans!'.`,
        given: {
            request: {
                method: "GET",
                uri: "https://mysite.com"
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
    }
];
