// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: 'CF-Functions | Docs',
    tagline: 'cf-functions documentation',
    url: 'https://burketyler.github.io',
    baseUrl: '/cf-functions/',
    onBrokenLinks: 'warn',
    onBrokenMarkdownLinks: 'warn',
    favicon: 'img/favicon-32x32.png',
    trailingSlash: false,

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'burketyler', // Usually your GitHub org/user name.
    projectName: 'burketyler.github.io', // Usually your repo name.

    // Even if you don't use internalization, you can use this field to set useful
    // metadata like html lang. For example, if your site is Chinese, you may want
    // to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve('./sidebars.js'),
                },
                blog: {
                    showReadingTime: true,
                },
                theme: {
                    customCss: require.resolve('./src/css/custom.css'),
                },
            }),
        ],
    ],

    themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            navbar: {
                title: 'Functions',
                hideOnScroll: true,
                logo: {
                    alt: 'cf-functions logo',
                    src: 'img/favicon-32x32.png',
                },
                items: [
                    {
                        type: 'doc',
                        docId: 'setup',
                        position: 'left',
                        label: 'Docs',
                    },
                    {
                        href: "https://github.com/burketyler/cf-functions",
                        label: "GitHub",
                        position: "right",
                    },
                ],
            },
            footer: {
                style: 'dark',
                links: [
                    {
                        title: "Docs",
                        items: [
                            {
                                label: "Setup",
                                to: "/docs/setup",
                            },
                            {
                                label: "Getting Started",
                                to: "/docs/getting-started",
                            },
                            {
                                label: "Usage",
                                to: "/docs/usage/configuration",
                            },
                        ],
                    },
                    {
                        title: "More",
                        items: [
                            {
                                label: "NPM",
                                href: "https://www.npmjs.com/package/cf-functions",
                            },
                            {
                                label: "GitHub",
                                href: "https://github.com/burketyler/cf-functions",
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} Wirt's Leg Pty Ltd.`,
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
            },
        }),
};

module.exports = config;
