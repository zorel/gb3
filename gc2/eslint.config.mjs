import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default defineConfig([
    globalIgnores(["node_modules"]),
    {
        files: ["**/*.js"],
        plugins: {
            prettier: prettierPlugin,
        },
        extends: [js.configs.recommended, prettierConfig],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            "no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                },
            ],
            "prettier/prettier": "error",
        },
    },
]);
