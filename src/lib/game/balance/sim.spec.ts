import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import prettier from "prettier";
import { describe, expect, it } from "vitest";
import {
	ARMED_FUSE_MS,
	ENEMY_SPAWN_MAX_INTERVAL,
	ENEMY_SPAWN_MIN_INTERVAL,
	MAX_ENEMIES,
} from "../config.js";
import {
	BATTERY_HEAL,
	SHIELD_MAX_HP,
	SHIELD_REGEN_INTERVAL,
} from "../config.js";
import {
	averageStats,
	DEFAULT_PARAMS,
	runSimulation,
	type SimParams,
} from "./sim.js";

const RUNS = 10;
const ACTIVE_RATIO = 0.5;
const DURATION_SEC = 1800;
const REACTION_SEC = 3;
const WORD_TTL = 12;
const WIPE_NOBUFF = { min: 120, max: 180 };
const WIPE_BUFF = { min: 480, max: 720 };
const BUFFS = {
	shieldUptime: 0.6,
	batteryGrantsPerHour: 12,
	batteryHeal: 5,
};
const OUTPUT_PATH = resolve(__dirname, "../../../../docs/balance.md");

function baseParams(total: number): Omit<SimParams, "seed"> {
	const active = Math.max(1, Math.round(total * ACTIVE_RATIO));
	return {
		...DEFAULT_PARAMS,
		reactionSec: REACTION_SEC,
		activePlayers: active,
		passivePlayers: total - active,
		durationSec: DURATION_SEC,
		settings: { wordTtl: WORD_TTL },
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
				const base = baseParams(total);
				const stats = averageStats(
					{
						...base,
						settings: {
							...base.settings,
							enemyDamageChance: chance,
							...(buff ? { batteryHeal: BUFFS.batteryHeal } : {}),
						},
						...(buff
							? {
									shieldUptime: BUFFS.shieldUptime,
									batteryGrantsPerHour: BUFFS.batteryGrantsPerHour,
								}
							: {}),
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

Сгенерировано: \`CALIBRATE=1 npx vitest run src/lib/game/balance/sim.spec.ts\`

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

Модель: headless-прогон реальных ECS-систем (\`src/lib/game/balance/sim.ts\` на
\`createHeadlessGame\`), без отдельного движка. Реальные константы: спавн
${ENEMY_SPAWN_MIN_INTERVAL}–${ENEMY_SPAWN_MAX_INTERVAL} сек, кап MAX_ENEMIES
${MAX_ENEMIES}, фьюз вооружённого слова ${ARMED_FUSE_MS} мс, урон 1 hp с шансом
\`p\` (сетка), батарея +${BATTERY_HEAL} hp, щит ${SHIELD_MAX_HP} hp (реген 1 /
${SHIELD_REGEN_INTERVAL} сек), печать ${
		DEFAULT_PARAMS.typingCharsPerSec
	} зн/сек + реакция ${REACTION_SEC} сек (включает стрим-задержку), ttl слова
${WORD_TTL} сек, активных ${ACTIVE_RATIO * 100}%, прогонов на ячейку: ${RUNS}.

**Жирным** — попадание в целевое окно (без баффов ${
		WIPE_NOBUFF.min / 60
	}–${WIPE_NOBUFF.max / 60} мин, с баффами ${WIPE_BUFF.min / 60}–${
		WIPE_BUFF.max / 60
	} мин); «≥${minutes(DURATION_SEC)}» = не все прогоны завершились вайпом.

${calibrate()}
`;
}

describe("balance simulation (headless ecs)", () => {
	const lobby: Omit<SimParams, "seed"> = {
		...DEFAULT_PARAMS,
		activePlayers: 10,
		passivePlayers: 20,
	};

	it("single run is deterministic and sane", () => {
		const params: SimParams = {
			...DEFAULT_PARAMS,
			activePlayers: 3,
			passivePlayers: 2,
			seed: 42,
		};
		const a = runSimulation(params);
		const b = runSimulation(params);

		expect(a).toEqual(b);
		expect(Number.isFinite(a.deathsPerHourPerPlayer)).toBe(true);
		expect(a.wordsSpawned).toBeGreaterThan(0);
		expect(a.wordsKilled + a.shotsFired).toBeLessThanOrEqual(a.wordsSpawned);
	});

	it("active bots keep words under control", () => {
		const stats = runSimulation({ ...lobby, seed: 3 });
		expect(stats.wordsSpawned).toBeGreaterThan(0);
		expect(stats.wordsKilled).toBeGreaterThan(0);
		expect(stats.wipeSec).toBeNull();
	});

	it("passive lobby with max damage wipes", () => {
		const stats = runSimulation({
			...lobby,
			activePlayers: 0,
			passivePlayers: 5,
			settings: { enemyDamageChance: 1 },
			seed: 5,
		});
		expect(stats.wipeSec).not.toBeNull();
		expect(stats.deaths).toBe(5);
	});

	it.skipIf(process.env.CALIBRATE !== "1")(
		"writes calibration report to docs/balance.md",
		{ timeout: 900000 },
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
