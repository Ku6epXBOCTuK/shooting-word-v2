import type { With } from "miniplex";
import type { StoredViewer } from "#lib/features/persistence/index.js";
import { GAMEOVER_DURATION, SESSION_INTRO_DURATION } from "../config.js";
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
			pendingPlayers.push({ ...entity.viewer, xp: entity.xp ?? 0 });
			ctx.world.remove(entity);
		}
	};

	const spawnPlayers = () => {
		for (const viewer of pendingPlayers) {
			spawnViewer(ctx.world, viewer, ctx.app.screen, viewer.xp);
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
		ctx.world.add({ banner: { text: "игра завершена" } });
		setPhase(entity, SESSIONPHASE.GAMEOVER);
	};

	return (dt) => {
		for (const entity of sessions) {
			const session = entity.session;

			if (session.phase !== lastPhase) {
				lastPhase = session.phase;
				if (session.phase === SESSIONPHASE.STARTING) {
					clearScene();
				}
			}

			session.timer += dt;

			if (
				session.phase === SESSIONPHASE.STARTING &&
				session.timer >= SESSION_INTRO_DURATION
			) {
				spawnPlayers();
				setPhase(entity, SESSIONPHASE.PLAYING);
			} else if (session.phase === SESSIONPHASE.PLAYING && allPlayersDead()) {
				finishGame(entity);
			} else if (
				session.phase === SESSIONPHASE.GAMEOVER &&
				session.timer >= GAMEOVER_DURATION
			) {
				for (const banner of banners) {
					ctx.world.remove(banner);
				}
				ctx.restoreViewers();
				setPhase(entity, SESSIONPHASE.IDLE);
			}
		}
	};
};
