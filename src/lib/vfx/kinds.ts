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
	"word-kill-mark",
	"device-spark",
	"doomsday",
	"timestop",
	"reward",
] as const;

export type ReactionKind = (typeof REACTION_KINDS)[number];

/** Долгоживущие эффекты, живущие контейнером в сцене. */
export const AURA_KINDS = ["shield", "doomsday", "portal"] as const;

export type AuraKind = (typeof AURA_KINDS)[number];

/** Эффекты-фильтры, навешиваемые на чужой спрайт. */
export const COATING_KINDS = ["ricochetium"] as const;

export type CoatingKind = (typeof COATING_KINDS)[number];
