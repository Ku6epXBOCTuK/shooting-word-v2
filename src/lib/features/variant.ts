import { APP_VARIANT } from "$app/env/public";

export type AppVariant = "static" | "node";

export const features = {
	rewards: APP_VARIANT === "node",
} as const;
