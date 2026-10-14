import type { Container, Filter } from "pixi.js";

/** Где в мире стоит эффект и в каком масштабе живёт. */
export interface VfxPlacement {
	x: number;
	y: number;
	scale: number;
}

/** Кадр, который хост отдаёт эффекту. Время приходит от хоста, не от часов. */
export interface VfxFrame extends VfxPlacement {
	/** длительность кадра, сек */
	dt: number;
	/** накопленное время жизни слоя, сек */
	t: number;
	/** сид из позиции — соседние корабли не должны пульсировать в унисон */
	phase: number;
}

/** Одноразовый эффект: реакция на событие. */
export interface VfxReaction {
	readonly root: Container;
	update(frame: VfxFrame): void;
	destroy(): void;
}

/**
 * Долгоживущий эффект, привязанный к состоянию (щит, портал, ядро).
 * Структурно совместим с `VfxReaction`, поэтому слой принимает и его.
 * Хост держит сильную ссылку и пишет `state` перед `layer.update(dt)`.
 */
export interface VfxAura<S> extends VfxReaction {
	state: S;
}

/** Эффект-фильтр, навешиваемый на чужой спрайт (обмазка рикошетиумом). */
export interface VfxFilter {
	readonly filter: Filter;
	update(frame: VfxFrame): void;
	destroy(): void;
}

export interface VfxOptions extends VfxPlacement {
	/** случайность, разрешается один раз при создании эффекта */
	rng: () => number;
	/** числовой параметр конкретного вида: цвет, сила */
	value?: number;
}

export type VfxReactionFactory = (options: VfxOptions) => VfxReaction;
export type VfxAuraFactory<S> = (options: VfxOptions) => VfxAura<S>;

/** Что вешается в слой как дочерний объект сцены. */
export type VfxLayerItem = VfxReaction;

/** Что вешается фильтром на чужой объект. */
export type VfxFilterTarget = Container;
