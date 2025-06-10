import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import tailwindcss from "eslint-plugin-tailwindcss";
import tseslint from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import sortPlugin from "eslint-plugin-sort";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
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
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
      ...tailwindcss.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      "tailwindcss/no-custom-classname": "off",
      "sort/imports": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // Prettier config (always last)
  prettier,
];

export default config;
