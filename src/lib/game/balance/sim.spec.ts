import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import prettier from "prettier";
import { describe, expect, it } from "vitest";
import {
	ARMED_FUSE_MS,
	ENEMY_SPAWN_MAX_INTERVAL,
	ENEMY_SPAWN_MIN_INTERVAL,
	PRESSURE_MAX_ENEMIES_BASE,
	PRESSURE_MAX_ENEMIES_CAP,
	PRESSURE_MAX_ENEMIES_PER_PLAYER,
	PRESSURE_SPAWN_SCALE_K,
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
const BUFF_LEVELS = [
	{
		label: "без баффов",
		shieldUptime: 0,
		batteryGrantsPerHour: 0,
		batteryHeal: BATTERY_HEAL,
		window: { min: 120, max: 180 },
	},
	{
		label: "баффы 50%",
		shieldUptime: 0.5,
		batteryGrantsPerHour: 6,
		batteryHeal: BATTERY_HEAL,
		window: { min: 360, max: 480 },
	},
	{
		label: "баффы 100%",
		shieldUptime: 1,
		batteryGrantsPerHour: 12,
		batteryHeal: BATTERY_HEAL,
		window: { min: 480, max: 720 },
	},
];
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

function wipeCell(
	stats: { wipeSec: number | null },
	window: { min: number; max: number },
): string {
	const sec = stats.wipeSec ?? DURATION_SEC;
	const text = sec >= DURATION_SEC ? `≥${minutes(DURATION_SEC)}` : minutes(sec);
	if (sec >= window.min && sec <= window.max) return `**${text}**`;
	return text;
}

const CHANCE_GRID = [0.4, 0.5, 0.6, 0.75, 1];
const K_GRID = [0.6, 0.9, 1.2, 1.5, 2.0];
const CALIB_TOTALS = [10, 30, 50];

async function calibrate(): Promise<string> {
	const sections: string[] = [];

	{
		const window = { min: 120, max: 180 };
		const header = `| k \\ total | ${CALIB_TOTALS.join(" | ")} |`;
		const sep = `| --- | ${CALIB_TOTALS.map(() => "---").join(" | ")} |`;
		const rows: string[] = [];
		for (const k of K_GRID) {
			const cells: string[] = [];
			for (const total of CALIB_TOTALS) {
				const base = baseParams(total);
				const stats = await averageStats(
					{
						...base,
						settings: {
							...base.settings,
							enemyDamageChance: 0.6,
							pressureSpawnK: k,
						},
					},
					RUNS,
				);
				cells.push(wipeCell(stats, window));
			}
			rows.push(`| ${k} | ${cells.join(" | ")} |`);
		}
		sections.push(
			`## Подбор k давления (без баффов, p=0.6, цель 2–3 мин)\n\n${[header, sep, ...rows].join("\n")}`,
		);
	}

	for (const buff of BUFF_LEVELS) {
		const header = `| шанс урона \\ total | ${CALIB_TOTALS.join(" | ")} |`;
		const sep = `| --- | ${CALIB_TOTALS.map(() => "---").join(" | ")} |`;
		const rows: string[] = [];
		for (const chance of CHANCE_GRID) {
			const cells: string[] = [];
			for (const total of CALIB_TOTALS) {
				const base = baseParams(total);
				const stats = await averageStats(
					{
						...base,
						shieldUptime: buff.shieldUptime,
						batteryGrantsPerHour: buff.batteryGrantsPerHour,
						settings: {
							...base.settings,
							enemyDamageChance: chance,
							batteryHeal: buff.batteryHeal,
						},
					},
					RUNS,
				);
				cells.push(wipeCell(stats, buff.window));
			}
			rows.push(`| ${chance} | ${cells.join(" | ")} |`);
		}
		sections.push(
			`## Вайп (мин), ${buff.label} (цель ${buff.window.min / 60}–${buff.window.max / 60} мин)\n\n${[header, sep, ...rows].join("\n")}`,
		);
	}

	return sections.join("\n\n");
}

async function buildReport(): Promise<string> {
	return `# Balance simulation

Сгенерировано: \`CALIBRATE=1 npx vitest run src/lib/game/balance/sim.spec.ts\`

Цели: \`docs/balance-targets.md\`. Активный режим (!игра): смерть перманентна,
конец раунда = вайп всех. Цели по покрытию баффов: ${BUFF_LEVELS.map(
		(b) => `${b.label} — ${b.window.min / 60}–${b.window.max / 60} мин`,
	).join(", ")} (баффы = щит uptime + батареи/час, ремонт +5 hp; выше ~60%
покрытия — плато, овербафф не продлевает раунд).

Модель: headless-прогон реальных ECS-систем (\`src/lib/game/balance/sim.ts\` на
\`createHeadlessGame\`), без отдельного движка. Реальные константы: спавн в idle
${ENEMY_SPAWN_MIN_INTERVAL}–${ENEMY_SPAWN_MAX_INTERVAL} сек, в playing —
давление: интервал / (1 + ${PRESSURE_SPAWN_SCALE_K} × пик живых за раунд), кап
${PRESSURE_MAX_ENEMIES_BASE} + ${PRESSURE_MAX_ENEMIES_PER_PLAYER} × живые (≤
${PRESSURE_MAX_ENEMIES_CAP}), фьюз вооружённого слова ${ARMED_FUSE_MS} мс, урон
1 hp с шансом \`p\` (сетка), батарея +${BATTERY_HEAL} hp, щит ${SHIELD_MAX_HP}
hp (реген 1 / ${SHIELD_REGEN_INTERVAL} сек), печать ${
		DEFAULT_PARAMS.typingCharsPerSec
	} зн/сек + реакция ${REACTION_SEC} сек (включает стрим-задержку), ttl слова
${WORD_TTL} сек, активных ${ACTIVE_RATIO * 100}%, прогонов на ячейку: ${RUNS}.

**Жирным** — попадание в целевое окно своего уровня баффов;
«≥${minutes(DURATION_SEC)}» = не все прогоны завершились вайпом.

${await calibrate()}
`;
}

describe("balance simulation (headless ecs)", () => {
	const lobby: Omit<SimParams, "seed"> = {
		...DEFAULT_PARAMS,
		activePlayers: 10,
		passivePlayers: 20,
	};

	it("single run is deterministic and sane", async () => {
		const params: SimParams = {
			...DEFAULT_PARAMS,
			activePlayers: 3,
			passivePlayers: 2,
			seed: 42,
		};
		const a = await runSimulation(params);
		const b = await runSimulation(params);

		expect(a).toEqual(b);
		expect(Number.isFinite(a.deathsPerHourPerPlayer)).toBe(true);
		expect(a.wordsSpawned).toBeGreaterThan(0);
		expect(a.wordsKilled + a.shotsFired).toBeLessThanOrEqual(a.wordsSpawned);
	});

	it("spawn pressure scales with alive viewers", async () => {
		const base: Omit<SimParams, "seed"> = {
			...DEFAULT_PARAMS,
			activePlayers: 0,
			passivePlayers: 0,
			durationSec: 120,
			settings: { enemyDamageChance: 0 },
		};
		const small = await runSimulation({ ...base, passivePlayers: 5, seed: 3 });
		const large = await runSimulation({ ...base, passivePlayers: 20, seed: 3 });
		expect(small.wordsSpawned).toBeGreaterThan(0);
		expect(large.wordsSpawned).toBeGreaterThan(small.wordsSpawned * 1.5);
	});

	it("pressure wipes active lobby eventually", async () => {
		const stats = await runSimulation({
			...lobby,
			reactionSec: REACTION_SEC,
			durationSec: 1800,
			settings: { wordTtl: WORD_TTL },
			seed: 3,
		});
		expect(stats.wipeSec).not.toBeNull();
	});

	it("passive lobby with max damage wipes", async () => {
		const stats = await runSimulation({
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
		{ timeout: 1500000 },
		async () => {
			const report = await buildReport();
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
