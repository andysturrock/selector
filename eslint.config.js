const tseslint = require('typescript-eslint');
const js = require('@eslint/js');
const globals = require('globals');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ["**/node_modules", "**/dist/", "**/build.js", "**/jest.config.ts"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["eslint.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // Common rules for all TypeScript files
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "indent": ["error", 2],
      "semi": ["error", "always"],
      "object-curly-spacing": ["error", "never"],
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
  {
    // Specific config for lambda-src
    files: ["lambda-src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./lambda-src/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    // Specific config for cdk
    files: ["cdk/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./cdk/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
  }
]);
