// NOTE: intentionally Pixi-free: features/rewards/config.ts imports this file
// and runs on the server.
export const REACTION_KINDS = [
	"ship-hit",
	"ship-ricochet",
	"word-destroyed",
	"bullet-miss",
	"viewer-destroyed",
	"word-kill-mark",
	"device-spark",
	"doomsday",
	"timestop",
	"reward",
] as const;

export type ReactionKind = (typeof REACTION_KINDS)[number];

export const AURA_KINDS = [
	"shield",
	"overcharge",
	"doomsday",
	"portal",
] as const;

export type AuraKind = (typeof AURA_KINDS)[number];

export const COATING_KINDS = ["armorCoating"] as const;

export type CoatingKind = (typeof COATING_KINDS)[number];
