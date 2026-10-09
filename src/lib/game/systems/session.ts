import type { With } from "miniplex";
import type { StoredViewer } from "#lib/features/persistence/index.js";
import {
	AFK_RESTART_DELAY,
	GAMEOVER_DURATION,
	SESSION_INTRO_DURATION,
} from "../config.js";
import { spawnViewer } from "../spawn.js";
import { SESSIONPHASE, type Entity, type SessionPhase } from "../types.js";
import type { SystemFactory } from "./types.js";

export const createSessionSystem: SystemFactory = (ctx) => {
	const sessions = ctx.world.with("session");
	const words = ctx.world.with("word");
	const projectiles = ctx.world.with("homing");
	const stars = ctx.world.with("star");
	const explosions = ctx.world.with("explosion");
	const viewers = ctx.world.with("viewer");
	const banners = ctx.world.with("banner");

	let lastPhase: SessionPhase = SESSIONPHASE.IDLE;
	let pendingPlayers: StoredViewer[] = [];
	let countdownBanner: Entity | null = null;

	const expireAll = (entities: Iterable<Entity>) => {
		for (const entity of entities) {
			ctx.world.addComponent(entity, "expired", true);
		}
	};

	const clearScene = () => {
		expireAll(words);
		expireAll(projectiles);
		expireAll(stars);
		expireAll(explosions);

		pendingPlayers = [];
		for (const entity of viewers) {
			pendingPlayers.push({
				...entity.viewer,
				xp: entity.xp ?? 0,
				batteries: entity.batteries ?? 0,
				revives: entity.revives ?? 0,
			});
			ctx.world.remove(entity);
		}
	};

	const spawnPlayers = () => {
		for (const viewer of pendingPlayers) {
			spawnViewer(ctx, viewer, viewer.xp, viewer.batteries, viewer.revives);
		}
		pendingPlayers = [];
	};

	const setPhase = (entity: With<Entity, "session">, phase: SessionPhase) => {
		entity.session.phase = phase;
		entity.session.timer = 0;
	};

	const allPlayersDead = () => {
		for (const entity of viewers) {
			if (!entity.dead) return false;
		}
		return true;
	};

	const finishGame = (entity: With<Entity, "session">) => {
		expireAll(words);
		expireAll(projectiles);
		ctx.world.add({ banner: { text: "игра завершена" } });
		setPhase(entity, SESSIONPHASE.GAMEOVER);
	};

	const revivePlayers = () => {
		for (const entity of viewers) {
			if (!entity.dead) continue;
			ctx.world.removeComponent(entity, "dead");
			if (entity.hp) {
				entity.hp.current = entity.hp.max;
			}
		}
		ctx.viewersDirty = true;
	};

	return (dt) => {
		for (const entity of sessions) {
			const session = entity.session;

			if (session.phase !== lastPhase) {
				lastPhase = session.phase;
				if (session.phase === SESSIONPHASE.STARTING) {
					clearScene();
					countdownBanner = ctx.world.add({
						banner: { text: "", scale: 3 },
					});
				} else if (countdownBanner) {
					ctx.world.remove(countdownBanner);
					countdownBanner = null;
				}
			}

			session.timer += dt;

			if (session.phase === SESSIONPHASE.STARTING) {
				if (countdownBanner?.banner) {
					const remaining = SESSION_INTRO_DURATION - session.timer;
					countdownBanner.banner.text = String(
						Math.max(1, Math.ceil(remaining)),
					);
				}
				if (session.timer >= SESSION_INTRO_DURATION) {
					spawnPlayers();
					setPhase(entity, SESSIONPHASE.PLAYING);
				}
			} else if (session.phase === SESSIONPHASE.PLAYING && allPlayersDead()) {
				finishGame(entity);
			} else if (
				session.phase === SESSIONPHASE.GAMEOVER &&
				session.timer >= GAMEOVER_DURATION
			) {
				for (const banner of banners) {
					ctx.world.remove(banner);
				}
				revivePlayers();
				setPhase(
					entity,
					session.afk ? SESSIONPHASE.INTERMISSION : SESSIONPHASE.IDLE,
				);
			} else if (session.phase === SESSIONPHASE.INTERMISSION) {
				if (!session.afk) {
					setPhase(entity, SESSIONPHASE.IDLE);
				} else if (session.timer >= AFK_RESTART_DELAY && viewers.size > 0) {
					setPhase(entity, SESSIONPHASE.STARTING);
				}
			} else if (
				session.afk &&
				session.phase === SESSIONPHASE.IDLE &&
				session.timer >= AFK_RESTART_DELAY &&
				viewers.size > 0
			) {
				setPhase(entity, SESSIONPHASE.STARTING);
			}
		}
	};
};
