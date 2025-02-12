const js = require("@eslint/js");
const ts = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const reactPlugin = require("eslint-plugin-react");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  js.configs.recommended,
  prettierConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      parser: tsParser,
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        URL: "readonly",
        alert: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        // Node.js globals
        require: "readonly",
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        console: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": ts,
      react: reactPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
      "react/prop-types": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
