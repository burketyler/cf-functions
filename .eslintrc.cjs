// eslint-disable-next-line no-undef
module.exports = {
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
  ],
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".mts", ".cts"],
    },
    "import/resolver": {
      typescript: {},
    },
  },
  rules: {
    "import/order": [
      "error",
      {
        alphabetize: { order: "asc" },
        groups: [
          ["object", "builtin", "external"],
          ["internal", "parent"],
          ["sibling", "index"],
        ],
        "newlines-between": "always",
      },
    ],
  },
  root: true,
};
