import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores([
        "js/peggy*.js",
        "node_modules",
    ]),
    {
        files: ["**/*.js"],
        extends: [
            js.configs.recommended,
        ],
        languageOptions: {
            globals: globals.browser
        },
        rules: {
            "no-unused-vars": ["error", {
                argsIgnorePattern: "^_",
                destructuredArrayIgnorePattern: "^_",
            }],
        },
    },
]);
