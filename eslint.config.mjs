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
        files: ["vite.config.js", "eslint.config.mjs"],
        languageOptions: { sourceType: "module" }
    },
    {
        files: ["**/*.js"],
        languageOptions: { sourceType: "module" }
    }
]);