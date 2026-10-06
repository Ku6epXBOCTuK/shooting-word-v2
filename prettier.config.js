/** @type {import("prettier").Config} */
const config = {
	useTabs: true,
	singleQuote: false,
	trailingComma: "all",
	printWidth: 80,
	proseWrap: "always",
	endOfLine: "lf",
	plugins: ["prettier-plugin-svelte"],
	overrides: [
		{
			files: "*.md",
			options: {
				useTabs: false,
			},
		},
		{
			files: "*.svelte",
			options: {
				parser: "svelte",
			},
		},
	],
};

export default config;
