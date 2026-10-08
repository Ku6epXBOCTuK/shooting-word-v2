import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import prettier from "prettier";
import { describe, expect, it } from "vitest";
import {
	averageStats,
	DEFAULT_PARAMS,
	runSimulation,
	type SimParams,
} from "./sim.js";

const RUNS = 10;
const ACTIVE_RATIO = 0.5;
const SPAWN_K = 1;
const DURATION_SEC = 1800;
const WIPE_NOBUFF = { min: 120, max: 180 };
const WIPE_BUFF = { min: 480, max: 720 };
const BUFFS = {
	shieldUptime: 0.6,
	batteryGrantsPerHour: 12,
	batteryHeal: 5,
};
const OUTPUT_PATH = resolve(__dirname, "../../../../docs/balance.md");

function baseParams(total: number): SimParams {
	const active = Math.max(1, Math.round(total * ACTIVE_RATIO));
	return {
		...DEFAULT_PARAMS,
		reactionSec: 3,
		activePlayers: active,
		passivePlayers: total - active,
		spawnScaleK: SPAWN_K,
		fireIntervalSec: 0.1,
		maxEnemiesBase: Math.round(1.5 * total),
		maxEnemiesPerPlayer: 0,
		wordTtl: 12,
		durationSec: DURATION_SEC,
		respawnDuration: Infinity,
	};
}

const minutes = (sec: number) => (sec / 60).toFixed(1);

function wipeCell(stats: { wipeSec: number | null }): string {
	const sec = stats.wipeSec ?? DURATION_SEC;
	const text = sec >= DURATION_SEC ? `≥${minutes(DURATION_SEC)}` : minutes(sec);
	if (sec >= WIPE_BUFF.min && sec <= WIPE_BUFF.max) return `**${text}**`;
	return text;
}

function noBuffCell(wipeSec: number | null): string {
	const sec = wipeSec ?? DURATION_SEC;
	const text = sec >= DURATION_SEC ? `≥${minutes(DURATION_SEC)}` : minutes(sec);
	if (sec >= WIPE_NOBUFF.min && sec <= WIPE_NOBUFF.max) return `**${text}**`;
	return text;
}

const CHANCE_GRID = [0.4, 0.5, 0.6, 0.75, 1];
const CALIB_TOTALS = [10, 30, 50];

function calibrate(): string {
	const sections: string[] = [];

	for (const buff of [false, true] as const) {
		const header = `| шанс урона \\ total | ${CALIB_TOTALS.join(" | ")} |`;
		const sep = `| --- | ${CALIB_TOTALS.map(() => "---").join(" | ")} |`;
		const rows = CHANCE_GRID.map((chance) => {
			const cells = CALIB_TOTALS.map((total) => {
				const stats = averageStats(
					{
						...baseParams(total),
						enemyDamageChance: chance,
						...(buff ? BUFFS : {}),
					},
					RUNS,
				);
				return buff ? wipeCell(stats) : noBuffCell(stats.wipeSec);
			});
			return `| ${chance} | ${cells.join(" | ")} |`;
		});
		sections.push(
			`## Вайп (мин), ${buff ? "баффы 60%" : "без баффов"}\n\n${[header, sep, ...rows].join("\n")}`,
		);
	}

	return sections.join("\n\n");
}

function buildReport(): string {
	return `# Balance simulation

Сгенерировано: \`npx vitest run src/lib/game/balance/sim.spec.ts\`

Цели: \`docs/balance-targets.md\`. Активный режим (!игра): смерть перманентна,
конец раунда = вайп всех. Цель: вайп за ${
		WIPE_NOBUFF.min / 60
	}–${WIPE_NOBUFF.max / 60} мин без баффов, ${
		WIPE_BUFF.min / 60
	}–${WIPE_BUFF.max / 60} мин с баффами 60% времени (щит uptime ${
		BUFFS.shieldUptime
	} + ${BUFFS.batteryGrantsPerHour} батареи/час, ремонт +${
		BUFFS.batteryHeal
	} hp).

Модель: \`src/lib/game/balance/sim.ts\`. Параметры: k = ${SPAWN_K}, hp ${DEFAULT_PARAMS.viewerHp}, урон 1 hp с шансом \`p\` (сетка),
батарея +${DEFAULT_PARAMS.batteryHeal} hp (лимит ${
		DEFAULT_PARAMS.batteryMax
	}), щит ${DEFAULT_PARAMS.shieldHp} hp (реген 1 / ${
		DEFAULT_PARAMS.shieldRegenInterval
	} сек), печать ${DEFAULT_PARAMS.typingCharsPerSec} зн/сек + реакция 3 сек
(включает стрим-задержку зрителя), активных ${ACTIVE_RATIO * 100}%,
прогонов на ячейку: ${RUNS}.

Давление — натуральный огонь (истёкшее слово стреляет почти сразу, ttl 12,
кап 1.5×total), дроссель минимален как предохранитель. Сетка подбирает шанс
урона \`p\` под целевые окна.
**Жирным** — попадание в целевое окно (без баффов ${
		WIPE_NOBUFF.min / 60
	}–${WIPE_NOBUFF.max / 60} мин, с баффами ${WIPE_BUFF.min / 60}–${
		WIPE_BUFF.max / 60
	} мин); «≥30» = не все прогоны завершились вайпом.

${calibrate()}
`;
}

describe("balance simulation", () => {
	it("single run is deterministic and sane", () => {
		const params: SimParams = {
			...DEFAULT_PARAMS,
			activePlayers: 3,
			passivePlayers: 2,
		};
		const a = runSimulation(params, 42);
		const b = runSimulation(params, 42);

		expect(a).toEqual(b);
		expect(Number.isFinite(a.deathsPerHourPerPlayer)).toBe(true);
		expect(a.wordsSpawned).toBeGreaterThan(0);
		expect(a.wordsKilled + a.shotsFired).toBeLessThanOrEqual(a.wordsSpawned);
	});

	it(
		"writes calibration report to docs/balance.md",
		{ timeout: 300000 },
		async () => {
			const report = buildReport();
			const config = await prettier.resolveConfig(OUTPUT_PATH);
			const formatted = await prettier.format(report, {
				...config,
				parser: "markdown",
			});
			writeFileSync(OUTPUT_PATH, formatted, "utf8");
			expect(formatted).toContain("вайп");
		},
	);
});
