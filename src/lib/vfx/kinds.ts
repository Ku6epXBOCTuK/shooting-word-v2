/**
 * Виды эффектов. Файл намеренно без Pixi: его импортирует
 * `features/rewards/config.ts`, который живёт на сервере.
 */
export const REACTION_KINDS = [
	"ship-hit",
	"ship-ricochet",
	"word-destroyed",
	"bullet-miss",
	"viewer-destroyed",
	"doomsday",
	"timestop",
	"reward",
] as const;

export type ReactionKind = (typeof REACTION_KINDS)[number];

export const AURA_KINDS = [
	"shield",
	"shimmer",
	"overcharge",
	"doomsday",
	"portal",
] as const;

export type AuraKind = (typeof AURA_KINDS)[number];
