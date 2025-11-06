const config = {
  extends: ["stylelint-config-tailwindcss"],
  plugins: ["stylelint-prettier"],
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
  },
};

export default config;
