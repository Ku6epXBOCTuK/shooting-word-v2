import {
	createDoomsdayAura,
	createOverchargeAura,
	createPortalAura,
} from "./auras.js";
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
	AuraStates,
	VfxFilter,
	VfxOptions,
	VfxReaction,
	VfxStateful,
} from "./types.js";

type AuraFactory<K extends keyof AuraStates> = (
	o: VfxOptions,
) => VfxStateful<AuraStates[K]>;

const AURAS: { [K in keyof AuraStates]?: AuraFactory<K> } = {
	shield: createShieldAura,
	overcharge: createOverchargeAura,
	doomsday: createDoomsdayAura,
	portal: createPortalAura,
};

const COATINGS: Partial<Record<CoatingKind, (o?: VfxOptions) => VfxFilter>> = {
	ricochetium: () => createMetalShimmer(),
};

export function createAura<K extends keyof AuraStates>(
	kind: K,
	options: VfxOptions,
): VfxStateful<AuraStates[K]> | undefined {
	return AURAS[kind]?.(options) as VfxStateful<AuraStates[K]> | undefined;
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
