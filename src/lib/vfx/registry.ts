import {
	AURA_KINDS,
	type AuraKind,
	COATING_KINDS,
	type CoatingKind,
} from "./kinds.js";
import { createShieldAura } from "./shield.js";
import { createMetalShimmer } from "./shimmer.js";
import type {
	VfxAura,
	VfxAuraFactory,
	VfxFilter,
	VfxOptions,
} from "./types.js";

const AURAS: Partial<Record<AuraKind, VfxAuraFactory<unknown>>> = {
	shield: createShieldAura as VfxAuraFactory<unknown>,
};

const COATINGS: Partial<Record<CoatingKind, (o?: VfxOptions) => VfxFilter>> = {
	ricochetium: () => createMetalShimmer(),
};

/** Ауры набираются по одному на каждое значение, появятся в шагах 4 и 6. */
export function createAura(
	kind: AuraKind,
	options: VfxOptions,
): VfxAura<unknown> | undefined {
	return AURAS[kind]?.(options);
}

export function createCoating(
	kind: CoatingKind,
	options?: VfxOptions,
): VfxFilter | undefined {
	return COATINGS[kind]?.(options);
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
