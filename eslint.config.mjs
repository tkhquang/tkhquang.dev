import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import tailwindcss from "eslint-plugin-tailwindcss";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import sortPlugin from "eslint-plugin-sort";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";

export default [
  {
    ignores: [
      "**/.yarn/*",
      "**/.temp/*",
      "node_modules/*",
      "dist/*",
      "build/*",
      "out/*",
      ".next/*",
      "legacy/*",
      "**/generated/*",
      "eslint.config.js",
      "public",
    ],
  },
  // React core (includes version auto-detection for JSX transform and rules)
  {
    plugins: {
      react: reactPlugin,
    },
    rules: {
      ...reactPlugin.configs["jsx-runtime"].rules,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // React Hooks rules (all recommended)
  {
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
  // Next.js + Tailwind + TypeScript + Import/Sort for all JS/TS/JSX/TSX files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tseslint,
      "jsx-a11y": jsxA11yPlugin,
      tailwindcss,
      import: importPlugin,
      sort: sortPlugin,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...nextPlugin.configs.recommended.rules,
      ...tailwindcss.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      "tailwindcss/no-custom-classname": "off",
      "sort/imports": "warn",
      // add more rules as needed
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: ["./tsconfig.json"],
      },
    },
  },
  // Prettier config (always last)
  prettier,
];
