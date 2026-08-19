import { defineConfig } from "oxlint";

export default defineConfig({
  // Enable all built-in categories to make it as strict as possible
  categories: {
    correctness: "error",
    perf: "error",
    suspicious: "error",
    pedantic: "off",
    style: "off",
    nursery: "off",
  },

  rules: {
    "eslint/no-magic-numbers": "off",
    "eslint/no-ternary": "off",
    "eslint/no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "eslint/no-shadow": "off",
    "eslint/no-underscore-dangle": "off",
    "eslint/no-await-in-loop": "off",
    "eslint/require-await": "off",
    "eslint/require-unicode-regexp": "off",
    "unicorn/prefer-string-replace-all": "off",
    "oxc/no-map-spread": "off",
  },
});
