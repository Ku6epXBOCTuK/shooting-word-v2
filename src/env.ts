import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
	APP_VARIANT: {
		public: true,
		static: true,
		schema: (value): "static" | "node" =>
			value === "node" ? "node" : "static",
	},
	TWITCH_CLIENT_ID: {
		schema: (value) => value,
	},
	TWITCH_CLIENT_SECRET: {
		schema: (value) => value,
	},
	TWITCH_BROADCASTER_ID: {
		schema: (value) => value,
	},
});
