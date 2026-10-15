import adapterNode from "@sveltejs/adapter-node";
import adapterStatic from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import Icons from "unplugin-icons/vite";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

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
			__APP_COMMIT__: JSON.stringify(process.env.APP_COMMIT ?? "dev"),
		},
		plugins: [
			sveltekit({
				paths: { base },
				compilerOptions: {
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
