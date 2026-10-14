import {
	AURA_KINDS,
	type AuraKind,
	COATING_KINDS,
	type CoatingKind,
	type ReactionKind,
} from "./kinds.js";
import { createReactionOf } from "./reactions.js";
import { createShieldAura } from "./shield.js";
import { createMetalShimmer } from "./shimmer.js";
import type {
	ShieldAuraState,
	VfxFilter,
	VfxOptions,
	VfxReaction,
	VfxStateful,
} from "./types.js";

const AURAS: Partial<
	Record<AuraKind, (o: VfxOptions) => VfxStateful<ShieldAuraState>>
> = {
	shield: createShieldAura,
};

const COATINGS: Partial<Record<CoatingKind, (o?: VfxOptions) => VfxFilter>> = {
	ricochetium: () => createMetalShimmer(),
};

/**
 * Состояние ауры по её виду. Список расширяется по мере появления видов,
 * поэтому возвращается объединение, а не индексированный доступ.
 */
export function createAura(
	kind: AuraKind,
	options: VfxOptions,
): VfxStateful<ShieldAuraState> | undefined {
	return AURAS[kind]?.(options) as VfxStateful<ShieldAuraState> | undefined;
}

export function createCoating(
	kind: CoatingKind,
	options?: VfxOptions,
): VfxFilter | undefined {
	return COATINGS[kind]?.(options);
}

export function createReaction(
	kind: ReactionKind,
	options: VfxOptions,
): VfxReaction {
	return createReactionOf(kind, options);
}

export function hasAura(kind: string): kind is AuraKind {
	return Object.hasOwn(AURAS, kind);
}

export function hasCoating(kind: string): kind is CoatingKind {
	return Object.hasOwn(COATINGS, kind);
}

export const REGISTERED_AURA_KINDS = Object.keys(AURAS);
export const REGISTERED_COATING_KINDS = Object.keys(COATINGS);
export const ALL_AURA_KINDS: readonly AuraKind[] = AURA_KINDS;
export const ALL_COATING_KINDS: readonly CoatingKind[] = COATING_KINDS;
