import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

import prettier from "eslint-config-prettier";
import tailwindcss from "eslint-plugin-tailwindcss";
import sortPlugin from "eslint-plugin-sort";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";

/*
 * eslint-config-next has shipped flat config since Next 15, so it is spread
 * in directly. Running it back through FlatCompat fed a flat config to the
 * eslintrc schema, which rejects an object-valued `plugins`, and eslintrc
 * then crashed stringifying the circular eslint-plugin-react object while
 * formatting that very error. The plugins below are only the ones Next's
 * config does not already register: redeclaring its own would be a
 * "Cannot redefine plugin" error.
 */
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
      "**/generated/*",
      "eslint.config.js",
      "public",
      /* Local scratch space, gitignored: never lint or format it */
      "00_idea/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      tailwindcss,
      sort: sortPlugin,
    },
    /*
     * Tailwind 4 dropped tailwindcss/lib/util/resolveConfigPath, so the
     * plugin cannot find a JS config and warned once per file, 676 lines a
     * run. Its own fallback is {}, so declaring that changes no behaviour
     * and only silences the warning. There is no JS config to point at:
     * the theme is CSS-first in src/assets/styles.
     */
    settings: {
      tailwindcss: {
        config: {},
      },
    },
    rules: {
      ...tailwindcss.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      "tailwindcss/no-custom-classname": "off",
      "sort/imports": "warn",
      "no-unused-vars": "off",
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
