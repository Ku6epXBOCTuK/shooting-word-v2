import { defineConfig } from "vitest/config";
import adapterStatic from "@sveltejs/adapter-static";
import adapterNode from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";

const base = (process.env.BASE_PATH ?? "") as "" | `/${string}`;
const variant = process.env.APP_VARIANT === "node" ? "node" : "static";

const adapter =
	variant === "node"
		? adapterNode({ out: "build-node" })
		: adapterStatic({ fallback: "404.html" });

export default defineConfig({
	plugins: [
		sveltekit({
			paths: { base },
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
				experimental: { async: true },
			},
			adapter,
			experimental: { remoteFunctions: true },
		}),
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: "./vite.config.ts",
				test: {
					name: "server",
					environment: "node",
					include: ["src/**/*.{test,spec}.{js,ts}"],
					exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
				},
			},
		],
	},
});
