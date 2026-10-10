import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import adapterStatic from "@sveltejs/adapter-static";
import adapterNode from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import Icons from "unplugin-icons/vite";

export default defineConfig(({ mode }) => {
	const fileEnv = loadEnv(mode, process.cwd(), "");
	for (const [key, value] of Object.entries(fileEnv)) {
		process.env[key] ??= value;
	}

	const base = (process.env.BASE_PATH ?? "") as "" | `/${string}`;
	const variant = process.env.APP_VARIANT === "node" ? "node" : "static";

	const adapter =
		variant === "node"
			? adapterNode({ out: "build-node" })
			: adapterStatic({ fallback: "404.html" });

	return {
		define: {
			__APP_VARIANT_NODE__: JSON.stringify(variant === "node"),
		},
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
			Icons({ compiler: "svelte" }),
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
	};
});
