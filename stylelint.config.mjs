const config = {
  extends: [
    "stylelint-config-recommended-scss",
    "stylelint-config-standard-scss",
    "stylelint-config-prettier-scss",
    "stylelint-config-tailwindcss",
  ],
  plugins: ["stylelint-scss", "stylelint-prettier"],
  rules: {
    "prettier/prettier": true,
    "at-rule-no-unknown": null,
    "at-rule-no-deprecated": [
      true,
      {
        ignoreAtRules: ["apply"],
      },
    ],
    "selector-class-pattern": [
      "^[a-z]([-]?[a-z0-9]+)*(__[a-z0-9]([-]?[a-z0-9]+)*)?(--[a-z0-9]([-|_]?[a-z0-9]+)*)?$",
      {
        resolveNestedSelectors: true,
      },
    ],
    "block-no-empty": true,
    "color-hex-length": "long",
    "color-no-invalid-hex": true,
    "no-descending-specificity": null,
    "selector-pseudo-element-no-unknown": [true, {}],
    "scss/at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "config",
          "utility",
          "layer",
          "theme",
          "custom-variant",
        ],
      },
    ],
  },
};

export default config;
