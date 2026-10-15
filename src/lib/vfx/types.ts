import type { Container, Filter, Texture } from "pixi.js";

export interface VfxPlacement {
	x: number;
	y: number;
	scale: number;
}

export interface VfxFrame extends VfxPlacement {
	dt: number;
	t: number;
	// NOTE: phase is a position-derived seed so neighbouring ships do not pulse
	// in unison.
	phase: number;
}

export interface VfxItem {
	readonly root: Container;
	update(frame: VfxFrame): void;
	destroy(): void;
}

// NOTE: the render layer puts the effect into ECS with this duration so the
// gameplay systems know when to drop the entity.
export interface VfxReaction extends VfxItem {
	readonly duration: number;
}

// NOTE: structurally compatible with VfxItem, so the layer accepts it too; the
// host holds a strong reference and writes state before layer.update(dt).
export interface VfxStateful<S> extends VfxItem {
	state: S;
}

export interface VfxFilter {
	readonly filter: Filter;
	update(frame: VfxFrame): void;
	destroy(): void;
}

export interface VfxOptions extends VfxPlacement {
	rng: () => number;
	value?: number;
	frames?: readonly Texture[];
	bullet?: Texture;
}

export type VfxReactionFactory = (options: VfxOptions) => VfxReaction;

// NOTE: plain numbers only, no Pixi types, so ECS types can reuse this shape.
export interface ShieldAuraState {
	hp: number;
	max: number;
	radius: number;
	hit: number;
	hitDir: { x: number; y: number };
}

export interface DoomsdayAuraState {
	active: boolean;
	shooter: { x: number; y: number } | null;
	shooterRadius: number;
}

export interface PortalAuraState {
	progress: number;
	groundY: number;
}

export interface OverchargeAuraState {
	radius: number;
}

// NOTE: these keys are also the only arguments createAura accepts, so the
// registry cannot grow a kind without a state.
export interface AuraStates {
	shield: ShieldAuraState;
	overcharge: OverchargeAuraState;
	doomsday: DoomsdayAuraState;
	portal: PortalAuraState;
}
