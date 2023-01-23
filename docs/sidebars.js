/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
    docs: [
        {
            type: "doc",
            label: "Setup",
            id: "setup",
        },
        {
            type: "doc",
            label: "Getting started",
            id: "getting-started",
        },
        {
            Usage: [
                "usage/configuration",
                "usage/typescript",
                "usage/deployment",
                "usage/testing",
                "usage/environment-variables",
            ],
        },
    ]
};

module.exports = sidebars;
