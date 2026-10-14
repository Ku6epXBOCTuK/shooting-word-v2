import type { ConsumableField } from "#lib/features/persistence/index.js";

/**
 * Одна строка профиля зрителя. `updatedAt` — версия содержимого: её двигает
 * только тот, кто менял данные, а база не даёт устаревшему снапшоту
 * перезаписать более свежую запись.
 */
export interface ViewerProfile {
	userId: string;
	data: unknown;
	updatedAt: number;
}

export interface ViewersRepo {
	load<T>(broadcasterId: string): T[];
	get<T>(broadcasterId: string, userId: string): T | null;
	/** Сливает записи по userId: не удаляет чужие профили и не откатывает более свежие. */
	upsert(broadcasterId: string, profiles: ViewerProfile[]): void;
	/**
	 * Серверное начисление расходника: правит профиль независимо от виджета
	 * (награда не теряется, даже если виджет закрыт) и возвращает новое
	 * абсолютное значение — его виджет применяет как синк, а не как `+1`.
	 */
	increment(
		broadcasterId: string,
		userId: string,
		field: ConsumableField,
		delta: number,
		cap: number,
		meta: { user: string },
	): number;
}
