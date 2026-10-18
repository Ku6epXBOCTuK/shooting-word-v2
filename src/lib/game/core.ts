import type { ChatMessage } from "#lib/chat/port.js";
import type {
	ConsumableField,
	ConsumableSync,
	StoredViewer,
	ViewerStore,
} from "#lib/features/persistence/viewer-store.js";
import {
	ARMOR_COATING_REWARD,
	BATTERY_REWARD,
	BEACON_REWARD,
	DOOMSDAY_REWARD,
	OVERCHARGE_REWARD,
	REVIVE_REWARD,
	rewardVisual,
	SHIELD_REWARD,
	TIME_STOP_REWARD,
} from "#lib/features/rewards/config.js";
import type { RoundRecord } from "#lib/features/rounds/record.js";
import { logger } from "#lib/logger.js";
import { createVfxLayer, type VfxLayer } from "#lib/vfx/layer.js";
import { World } from "miniplex";
import type { Application } from "pixi.js";
import type { GameAssets } from "./assets.js";
import {
	BEACON_DELAY,
	BEACON_MAX,
	BULLET_HIT_DISTANCE,
	BULLET_SPEED,
	DOOMSDAY_DURATION,
	REVIVE_MAX,
	SHIELD_MAX_HP,
	TIME_STOP_DURATION,
	VIEWER_GROUND_MARGIN,
	VIEWER_HEIGHT,
	VIEWER_TIMEOUT_MS,
} from "./config.js";
import type { GameContext, RenderContext } from "./context.js";
import { addReaction } from "./reaction.js";
import { bumpRoundStat, createRoundStats } from "./round-stats.js";
import { defaultSettings, type GameSettings } from "./settings.js";
import { SHIP_COUNT } from "./ships.js";
import { spawnViewer } from "./spawn.js";
import { cleanupGroups, logicGroups, renderGroups } from "./systems/index.js";
import type { System } from "./systems/types.js";
import {
	SESSIONPHASE,
	type Entity,
	type Position,
	type SessionPhase,
	type Size,
	type ViewerIdentity,
} from "./types.js";

// NOTE: raises the local counter to the server value and never rolls it back,
// so what was already earned or spent this session survives a stale snapshot.
const syncConsumable = (
	entity: Entity,
	field: ConsumableField,
	value: number | undefined,
	cap: number,
): boolean => {
	if (value === undefined) return false;
	const current = entity[field] ?? 0;
	const next = Math.min(cap, Math.max(current, value));
	if (next === current) return false;
	entity[field] = next;
	return true;
};

export interface GameCoreOptions {
	screen: Size;
	settings?: GameSettings;
	viewerStore: ViewerStore;
	onRoundEnd?: (record: RoundRecord) => void;
	now?: () => number;
	rng?: () => number;
	measureText: (text: string, fontSize: number) => Size;
}

export interface GameCoreRender {
	app: Application;
	assets: GameAssets;
}

export function createGameCore(
	options: GameCoreOptions,
	render?: GameCoreRender,
) {
	const world = new World<Entity>();
	const viewers = world.with("viewer");
	const viewersWithPosition = world.with("viewer", "position");
	const wordsWithPosition = world.with("word", "position");
	const doomsdayDevices = world.with("doomsday");
	const timeStops = world.with("timeStop");

	const ctx: GameContext = {
		world,
		screen: options.screen,
		settings: options.settings ?? defaultSettings(),
		viewerStore: options.viewerStore,
		viewersDirty: false,
		viewerProfiles: new Map<string, StoredViewer>(),
		onRoundEnd: options.onRoundEnd,
		now: options.now ?? Date.now,
		rng: options.rng ?? Math.random,
		measureText: options.measureText,
	};
	// NOTE: factoryCtx MUST be the same object as ctx, not a copy: the public API
	// (joinViewer, grantBatteries, repair, ...) writes ctx.viewersDirty, while
	// systems (notably viewer-persistence) read it from the factory context.
	const vfx = render ? createVfxLayer(render.app.stage) : null;
	const factoryCtx: RenderContext = render
		? Object.assign(ctx, {
				app: render.app,
				assets: render.assets,
				vfx: vfx as VfxLayer,
			})
		: (ctx as RenderContext);

	const groupDefs: { factories: ((ctx: RenderContext) => System)[] }[] = render
		? [...logicGroups(), ...renderGroups(), ...cleanupGroups()]
		: [...logicGroups(), ...cleanupGroups()];

	// NOTE: fires even for rewards with no lasting effect on the ship, so the
	// viewer still sees the reward land; look and colour come from RewardConfig.visual.
	const reactToReward = (key: string, at?: Position) => {
		const visual = rewardVisual(key);
		if (!visual || !at) return;
		addReaction(ctx, at, visual.reaction, visual.color);
	};

	const createGroups = () =>
		groupDefs.map((group) =>
			group.factories.map((factory) => factory(factoryCtx)),
		);

	let groups = createGroups();

	const createSession = () =>
		world.add({
			session: {
				phase: SESSIONPHASE.IDLE as SessionPhase,
				timer: 0,
				afk: false as boolean,
			},
			roundStats: createRoundStats(),
		});
	let session = createSession();

	const findViewer = (userId: string): Entity | undefined => {
		for (const entity of viewers) {
			if (entity.viewer.userId === userId) return entity;
		}
		return undefined;
	};

	// NOTE: a viewer can chat before profiles finish loading, so the saved
	// profile lands on an existing entity; counters are max()-ed so progress
	// made in this session is never lost.
	const adoptProfile = (entity: Entity, profile: StoredViewer) => {
		if (!entity.viewer) return;
		entity.xp = Math.max(entity.xp ?? 0, profile.xp ?? 0);
		entity.batteries = Math.max(entity.batteries ?? 0, profile.batteries ?? 0);
		entity.revives = Math.max(entity.revives ?? 0, profile.revives ?? 0);
		entity.beacons = Math.max(entity.beacons ?? 0, profile.beacons ?? 0);
		entity.viewer.skin = profile.skin ?? entity.viewer.skin;
	};

	const restoreViewers = async () => {
		const now = ctx.now();
		for (const viewer of await ctx.viewerStore.load()) {
			if (viewer.bot) continue;
			ctx.viewerProfiles.set(viewer.userId, viewer);

			const entity = findViewer(viewer.userId);
			if (entity) {
				adoptProfile(entity, viewer);
				continue;
			}

			if (now - viewer.lastSeen < VIEWER_TIMEOUT_MS) {
				spawnViewer(ctx, viewer, viewer);
			} else {
				logger.info(
					`[viewers] keep ${viewer.user} (${viewer.userId}) off-screen, idle ${Math.round((now - viewer.lastSeen) / 3_600_000)}h`,
				);
			}
		}
	};
	void restoreViewers();

	const step = (dt: number) => {
		for (const group of groups) {
			for (const system of group) {
				system(dt);
			}
		}
	};

	const disposeGroups = () => {
		for (const group of groups) {
			for (const system of group) {
				system.dispose?.();
			}
		}
	};

	type TimedComponent = "shield" | "overcharge" | "armorCoating";

	const applyTimedReward = <C extends TimedComponent>(
		component: C,
		rewardKey: string,
		make: (expiresAt: number) => NonNullable<Entity[C]>,
	) => {
		return (entries: { userId: string; expiresAt: number }[]) => {
			const map = new Map(
				entries.map((entry) => [entry.userId, entry.expiresAt]),
			);

			for (const entity of viewers) {
				const expiresAt = map.get(entity.viewer.userId);
				if (expiresAt === undefined) continue;

				const current = entity[component];
				if (!current) {
					world.addComponent(entity, component, make(expiresAt));
					reactToReward(rewardKey, entity.position);
				} else if (current.expiresAt < expiresAt) {
					current.expiresAt = expiresAt;
				}
			}
		};
	};

	return {
		world,

		step,

		joinViewer: (identity: ViewerIdentity) => {
			for (const entity of viewers) {
				if (entity.viewer.userId === identity.userId) {
					entity.viewer.user = identity.user;
					entity.viewer.login = identity.login;
					entity.viewer.lastSeen = ctx.now();
					ctx.viewersDirty = true;
					return;
				}
			}

			const profile = identity.bot
				? undefined
				: ctx.viewerProfiles.get(identity.userId);
			spawnViewer(
				ctx,
				{
					...identity,
					lastSeen: ctx.now(),
					skin: profile?.skin ?? Math.floor(ctx.rng() * SHIP_COUNT),
				},
				profile ?? {},
			);
			ctx.viewersDirty = true;
		},

		applyShields: applyTimedReward(
			"shield",
			SHIELD_REWARD.key,
			(expiresAt) => ({ expiresAt, hp: SHIELD_MAX_HP }),
		),

		applyOvercharges: applyTimedReward(
			"overcharge",
			OVERCHARGE_REWARD.key,
			(expiresAt) => ({ expiresAt }),
		),

		applyArmorCoating: applyTimedReward(
			"armorCoating",
			ARMOR_COATING_REWARD.key,
			(expiresAt) => ({ expiresAt }),
		),

		grantBatteries: (userIds: string[]) => {
			let changed = false;
			for (const userId of userIds) {
				for (const entity of viewers) {
					if (entity.viewer.userId !== userId) continue;
					entity.batteries = Math.min(
						ctx.settings.batteryMax,
						(entity.batteries ?? 0) + 1,
					);
					reactToReward(BATTERY_REWARD.key, entity.position);
					changed = true;
					break;
				}
			}
			if (changed) ctx.viewersDirty = true;
		},

		grantRevives: (userIds: string[]) => {
			let changed = false;
			for (const userId of userIds) {
				for (const entity of viewers) {
					if (entity.viewer.userId !== userId) continue;
					entity.revives = Math.min(REVIVE_MAX, (entity.revives ?? 0) + 1);
					reactToReward(REVIVE_REWARD.key, entity.position);
					changed = true;
					break;
				}
			}
			if (changed) ctx.viewersDirty = true;
		},

		grantBeacons: (userIds: string[]) => {
			let changed = false;
			for (const userId of userIds) {
				for (const entity of viewers) {
					if (entity.viewer.userId !== userId) continue;
					entity.beacons = Math.min(BEACON_MAX, (entity.beacons ?? 0) + 1);
					reactToReward(BEACON_REWARD.key, entity.position);
					changed = true;
					break;
				}
			}
			if (changed) ctx.viewersDirty = true;
		},

		// NOTE: the server already granted the reward into the profile, so this
		// only raises the local value, never a second +1.
		applyConsumables: (entries: ConsumableSync[]) => {
			let changed = false;
			for (const entry of entries) {
				for (const entity of viewers) {
					if (entity.viewer.userId !== entry.userId) continue;
					changed =
						syncConsumable(
							entity,
							"batteries",
							entry.batteries,
							ctx.settings.batteryMax,
						) || changed;
					changed =
						syncConsumable(entity, "revives", entry.revives, REVIVE_MAX) ||
						changed;
					changed =
						syncConsumable(entity, "beacons", entry.beacons, BEACON_MAX) ||
						changed;
					break;
				}
			}
			if (changed) ctx.viewersDirty = true;
		},

		remoteRevive: (userId: string, targetUser: string) => {
			if (session.session.phase !== SESSIONPHASE.PLAYING) return false;

			const wanted = targetUser.toLowerCase();
			let owner: Entity | undefined;
			let target: Entity | undefined;
			for (const entity of viewers) {
				if (entity.viewer.userId === userId) owner = entity;
				if (entity.viewer.login.toLowerCase() === wanted) target = entity;
			}
			if (!owner || (owner.beacons ?? 0) <= 0) return false;
			if (!target?.dead || !target.position) return false;
			if (target.respawning) return false;

			owner.beacons = (owner.beacons ?? 0) - 1;
			ctx.viewersDirty = true;
			world.addComponent(target, "respawning", {
				elapsed: 0,
				duration: BEACON_DELAY,
				x: target.position.x,
			});
			return true;
		},

		doomsday: (userId: string): boolean => {
			if (doomsdayDevices.size > 0) return false;

			let user: string | undefined;
			let from: { x: number; y: number } | undefined;
			for (const entity of viewersWithPosition) {
				if (entity.viewer.userId === userId) {
					if (entity.dead) return false;
					user = entity.viewer.user;
					const halfHeight =
						(entity.size?.height ?? VIEWER_HEIGHT * ctx.settings.viewerScale) /
						2;
					from = {
						x: entity.position.x,
						y: entity.position.y - halfHeight,
					};
					break;
				}
			}
			user ??= userId;
			from ??= {
				x: ctx.screen.width / 2,
				y: ctx.screen.height - VIEWER_GROUND_MARGIN,
			};

			for (const entity of wordsWithPosition) {
				world.addComponent(entity, "doomsdayed", true);
			}

			const device = world.add({
				doomsday: {
					shooterId: userId,
					user,
					elapsed: 0,
					duration: DOOMSDAY_DURATION,
					active: false,
					sparkTimer: 0,
					boltTimer: 0,
				},
				position: {
					x: ctx.screen.width / 2,
					y: ctx.screen.height / 2,
				},
			});

			world.add({
				doomsdayBolt: { intro: true },
				homing: {
					target: device,
					speed: BULLET_SPEED,
					hitDistance: BULLET_HIT_DISTANCE,
				},
				position: { x: from.x, y: from.y },
			});
			reactToReward(DOOMSDAY_REWARD.key, from);
			return true;
		},

		timeStop: () => {
			if (timeStops.size > 0) return;

			world.add({
				timeStop: { elapsed: 0, duration: TIME_STOP_DURATION },
			});
			reactToReward(TIME_STOP_REWARD.key, {
				x: ctx.screen.width / 2,
				y: ctx.screen.height / 2,
			});
		},

		repair: (userId: string, targetUser?: string) => {
			const wanted = targetUser?.toLowerCase();
			let targetId: string | undefined;
			if (wanted !== undefined) {
				for (const entity of viewers) {
					if (entity.viewer.login.toLowerCase() === wanted) {
						targetId = entity.viewer.userId;
						break;
					}
				}
				if (targetId === undefined) return false;
			}

			let healer: Entity | undefined;
			let target: Entity | undefined;
			for (const entity of viewers) {
				if (entity.viewer.userId === userId) healer = entity;
				if (targetId !== undefined && entity.viewer.userId === targetId) {
					target = entity;
				}
			}
			if (!healer || (healer.batteries ?? 0) <= 0) return false;

			target ??= healer;
			if (!target.hp || target.dead || target.hp.current >= target.hp.max) {
				return false;
			}

			healer.batteries = (healer.batteries ?? 0) - 1;
			const heal =
				target === healer
					? ctx.settings.batteryHeal
					: ctx.settings.batteryHealOther;
			target.hp.current = Math.min(target.hp.max, target.hp.current + heal);
			if (session.roundStats && healer.viewer) {
				bumpRoundStat(
					session.roundStats,
					"heals",
					healer.viewer.userId,
					healer.viewer.user,
				);
			}
			ctx.viewersDirty = true;
			return true;
		},

		removeBots: () => {
			const toRemove: Entity[] = [];
			for (const entity of viewers) {
				if (entity.bot) {
					toRemove.push(entity);
				}
			}
			for (const entity of toRemove) {
				world.remove(entity);
			}
			if (toRemove.length > 0) ctx.viewersDirty = true;
		},

		changeSkin: (userId: string, skin?: number) => {
			for (const entity of viewers) {
				if (entity.viewer.userId !== userId) continue;

				const valid = skin !== undefined && skin >= 1 && skin <= SHIP_COUNT;
				entity.viewer.skin = valid
					? skin - 1
					: Math.floor(ctx.rng() * SHIP_COUNT);
				ctx.viewersDirty = true;
				return;
			}
		},

		shoot: (message: ChatMessage) => {
			let shooter: Entity | undefined;
			let from: { x: number; y: number } | undefined;
			for (const entity of viewersWithPosition) {
				if (entity.viewer.userId === message.userId) {
					if (entity.dead) return;
					shooter = entity;
					const halfHeight =
						(entity.size?.height ?? VIEWER_HEIGHT * ctx.settings.viewerScale) /
						2;
					from = {
						x: entity.position.x,
						y: entity.position.y - halfHeight,
					};
					break;
				}
			}
			from ??= {
				x: ctx.screen.width / 2,
				y: ctx.screen.height - VIEWER_GROUND_MARGIN,
			};

			const all = message.text
				.trim()
				.toLowerCase()
				.split(/\s+/)
				.filter(Boolean);
			const words = shooter?.overcharge ? [...new Set(all)] : all.slice(0, 1);
			if (words.length === 0) return;

			for (const text of words) {
				const targets: Entity[] = [];
				for (const entity of wordsWithPosition) {
					if (entity.word.text.toLowerCase() === text) {
						targets.push(entity);
					}
				}

				if (targets.length === 0) {
					if (!ctx.settings.viewerMisses) continue;

					const target = world.add({
						position: {
							x: ctx.rng() * ctx.screen.width,
							y: ctx.rng() * ctx.screen.height,
						},
					});
					world.add({
						bullet: { shooterId: message.userId, miss: true },
						homing: {
							target,
							speed: BULLET_SPEED,
							hitDistance: BULLET_HIT_DISTANCE,
						},
						position: { x: from.x, y: from.y },
					});
					continue;
				}

				for (const target of targets) {
					world.add({
						bullet: { shooterId: message.userId },
						homing: {
							target,
							speed: BULLET_SPEED,
							hitDistance: BULLET_HIT_DISTANCE,
						},
						position: { x: from.x, y: from.y },
					});
				}
			}
		},

		startGame() {
			if (session.session.phase !== SESSIONPHASE.IDLE) return;
			session.session.phase = SESSIONPHASE.STARTING;
			session.session.timer = 0;
		},

		setAfk(enabled: boolean) {
			session.session.afk = enabled;
			session.session.timer = 0;
			const phase = session.session.phase;
			if (
				enabled &&
				viewers.size > 0 &&
				(phase === SESSIONPHASE.IDLE || phase === SESSIONPHASE.INTERMISSION)
			) {
				session.session.phase = SESSIONPHASE.STARTING;
			}
		},

		respawn(userId: string) {
			for (const entity of viewers) {
				if (entity.viewer.userId !== userId || !entity.dead) continue;

				world.removeComponent(entity, "dead");
				if (entity.hp) {
					entity.hp.current = entity.hp.max;
				}
				ctx.viewersDirty = true;
				return;
			}
		},

		reset() {
			world.clear();

			disposeGroups();

			groups = createGroups();
			session = createSession();
			void restoreViewers();
		},

		dispose() {
			world.clear();
			disposeGroups();
			vfx?.destroy();
		},
	};
}

export type GameCore = ReturnType<typeof createGameCore>;
