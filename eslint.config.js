import prettier from "eslint-config-prettier";
import path from "node:path";
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore");

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.recommended,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } },
		rules: {
			"no-undef": "off",
			"no-console": "error",
		},
	},
	{
		files: ["src/lib/logger.ts", "scripts/**"],
		rules: {
			"no-console": "off",
		},
	},
	{
		files: ["src/lib/game/balance/**"],
		rules: {
			"no-console": "off",
			"@typescript-eslint/no-unused-vars": "off",
		},
	},
	{
		files: ["src/**"],
		ignores: [
			"src/lib/server/**",
			"src/routes/api/**",
			"src/routes/auth/**",
			"**/+server.ts",
			"**/*.server.ts",
			"**/*.spec.ts",
			"**/*.test.ts",
		],
		rules: {
			"no-restricted-imports": [
				"error",
				{
					patterns: [
						{
							group: [
								"?lib/server/**",
								"@twurple/api",
								"@twurple/auth",
								"@twurple/eventsub-*",
								"$app/env/private",
								"node:*",
							],
							message:
								"server-only import outside server zone (breaks static build)",
						},
					],
				},
			],
		},
	},
	{
		files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: [".svelte"],
				parser: ts.parser,
			},
		},
	},
	{
		rules: {},
	},
);
