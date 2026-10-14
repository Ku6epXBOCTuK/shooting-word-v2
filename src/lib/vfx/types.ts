import type { Container, Filter, Texture } from "pixi.js";

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

/** Минимальный контракт слоя: контейнер, кадр, снос. */
export interface VfxItem {
	readonly root: Container;
	update(frame: VfxFrame): void;
	destroy(): void;
}

/**
 * Одноразовый отклик на событие. Срок жизни объявляет сам эффект — рендер
 * кладёт его в ECS, чтобы логика знала, когда убрать сущность.
 */
export interface VfxReaction extends VfxItem {
	readonly duration: number;
}

/**
 * Долгоживущий эффект, привязанный к состоянию (щит, портал, ядро).
 * Структурно совместим с `VfxItem`, поэтому слой принимает и его.
 * Хост держит сильную ссылку и пишет `state` перед `layer.update(dt)`.
 */
export interface VfxStateful<S> extends VfxItem {
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
	/** числовой параметр конкретного вида: цвет, сила, диапазон */
	value?: number;
	/** кадры покадровой анимации, если эффект их использует */
	frames?: readonly Texture[];
	/** спрайт снаряда, если эффект летящий */
	bullet?: Texture;
}

export type VfxReactionFactory = (options: VfxOptions) => VfxReaction;

/** Состояние щита. Только числа — без Pixi, переиспользуется в ECS-типах. */
export interface ShieldAuraState {
	/** сколько зарядов осталось */
	hp: number;
	/** сколько зарядов бывает всего */
	max: number;
	/** половина большей стороны корабля в мировых пикселях, уже с учётом масштаба */
	radius: number;
	/** 0..1 — насколько сильно искажение от последнего попадания */
	hit: number;
	/** единичный вектор от точки удара к кораблю */
	hitDir: { x: number; y: number };
}

/** Состояние ядра устройства doomsday. */
export interface DoomsdayAuraState {
	/** ядро начало работать */
	active: boolean;
	/** корабль стрелка, вокруг которого идёт кольцо; null если корабля нет */
	shooter: { x: number; y: number } | null;
	/** половина высоты корабля стрелка */
	shooterRadius: number;
}

/** Состояние портала возврата. */
export interface PortalAuraState {
	/** 0..1 — сколько осталось ждать */
	progress: number;
	/** линия земли в мировых пикселях */
	groundY: number;
}

/**
 * Соответствие вида ауры и её состояния. Реестр не даст завести вид без
 * состояния: ключи здесь и есть допустимые аргументы `createAura`.
 */
export interface AuraStates {
	shield: ShieldAuraState;
	doomsday: DoomsdayAuraState;
	portal: PortalAuraState;
}
