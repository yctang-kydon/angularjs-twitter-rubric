import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: {
            globals: {
                ...globals.browser,
                angular: "readonly",
                flatpickr: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "warn",
            "prefer-const": "error",
            "semi": ["error", "always"],
            "indent": ["error", 4]
        }
    },
    {
        files: ["**/*.js"],
        languageOptions: { sourceType: "script" }
    }
]);