import type { Viewer } from "../../game/types.js";
import type { StoragePort } from "./port.js";

const KEY = "viewers";

export const CONSUMABLE_FIELDS = ["batteries", "revives", "beacons"] as const;
export type ConsumableField = (typeof CONSUMABLE_FIELDS)[number];

export type StoredViewer = Viewer & {
	xp: number;
	/**
	 * Версия содержимого: обновляется только при реальном изменении данных.
	 * Сервер не даёт записи с более старой версией перетереть свежую — это
	 * защищает от отката устаревшим снапшотом (вторая вкладка, гонка на старте).
	 */
	updatedAt?: number;
} & Record<ConsumableField, number>;

/**
 * Абсолютные счётчики расходников с сервера: виджет применяет их как синк
 * (берёт максимум), а не как `+1` — двойное начисление исключено.
 */
export interface ConsumableSync {
	userId: string;
	batteries?: number;
	revives?: number;
	beacons?: number;
}

function isStoredViewer(value: unknown): value is StoredViewer {
	if (typeof value !== "object" || value === null) return false;
	const viewer = value as Record<string, unknown>;
	return (
		typeof viewer.userId === "string" &&
		typeof viewer.user === "string" &&
		typeof viewer.login === "string" &&
		typeof viewer.lastSeen === "number" &&
		(viewer.xp === undefined || typeof viewer.xp === "number") &&
		(viewer.batteries === undefined || typeof viewer.batteries === "number") &&
		(viewer.revives === undefined || typeof viewer.revives === "number") &&
		(viewer.beacons === undefined || typeof viewer.beacons === "number") &&
		(viewer.bot === undefined || typeof viewer.bot === "boolean") &&
		(viewer.skin === undefined || typeof viewer.skin === "number") &&
		(viewer.updatedAt === undefined || typeof viewer.updatedAt === "number")
	);
}

/** Поля, по которым сравнивается содержимое профиля (без версии updatedAt). */
const PROFILE_FIELDS = [
	"userId",
	"user",
	"login",
	"lastSeen",
	"skin",
	"bot",
	"xp",
	"batteries",
	"revives",
	"beacons",
] as const;

function contentKey(viewer: StoredViewer): string {
	return JSON.stringify(
		PROFILE_FIELDS.map((field) => viewer[field] as unknown),
	);
}

/**
 * Сливает свежее состояние корабля с профилем: неизменённый профиль
 * возвращает как есть (версия не двигается — остальные писатели не получают
 * ложный сигнал «данные изменились»), изменённый — помечает версией `now`.
 */
export function mergeProfile(
	prev: StoredViewer | undefined,
	next: StoredViewer,
	now: number,
): StoredViewer {
	if (prev && contentKey(prev) === contentKey(next)) return prev;
	return { ...next, updatedAt: now };
}

export class ViewerStore {
	private loading: Promise<StoredViewer[]> | null = null;

	constructor(private readonly storage: StoragePort) {}

	/**
	 * Первая загрузка запускает чтение, повторные ждут тот же промис:
	 * сохранения не могут обогнать чтение и записать неполный список.
	 */
	load(): Promise<StoredViewer[]> {
		this.loading ??= this.fetch();
		return this.loading;
	}

	private async fetch(): Promise<StoredViewer[]> {
		let parsed: unknown;
		try {
			parsed = await this.storage.load(KEY);
		} catch {
			return [];
		}
		if (!Array.isArray(parsed)) return [];

		return parsed.filter(isStoredViewer).map((viewer) => ({
			...viewer,
			xp: viewer.xp ?? 0,
			batteries: viewer.batteries ?? 0,
			revives: viewer.revives ?? 0,
			beacons: viewer.beacons ?? 0,
			skin: viewer.skin ?? 0,
		}));
	}

	async save(viewers: StoredViewer[]): Promise<void> {
		await this.load();
		await this.storage.save(KEY, viewers);
	}
}
