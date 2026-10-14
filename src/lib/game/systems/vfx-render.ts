import { createReaction } from "../../vfx/registry.js";
import type { VfxOptions, VfxReaction } from "../../vfx/types.js";
import type { RenderSystemFactory, System } from "./types.js";

/** Устойчивый срез запроса `with("vfx", "position")`. */
type ReactionEntity = { position: { x: number; y: number } } & {
	vfx: { kind: import("../../vfx/kinds.js").ReactionKind; value?: number };
};

/**
 * Рисует отклики на события. Логика (`systems/vfx.ts`) только старит сущности
 * и снимает `expired`; вид и срок жизни эффекта решает `vfx/reactions.ts`.
 */
export const createVfxRenderSystem: RenderSystemFactory = (ctx) => {
	const reactions = ctx.world.with("vfx", "position");
	const effects = new Map<object, VfxReaction>();

	const optionsOf = (entity: ReactionEntity): VfxOptions => ({
		x: entity.position.x,
		y: entity.position.y,
		scale: ctx.settings.viewerScale,
		rng: ctx.rng,
		value: entity.vfx.value,
		frames: ctx.assets.explosion,
		bullet: ctx.assets.bullet,
	});

	const unsubscribeAdded = reactions.onEntityAdded.subscribe((entity) => {
		const effect = createReaction(
			entity.vfx.kind,
			optionsOf(entity as unknown as ReactionEntity),
		);
		effects.set(entity, effect);
		ctx.vfx.add(effect, optionsOf(entity as unknown as ReactionEntity));
	});

	const unsubscribeRemoved = reactions.onEntityRemoved.subscribe((entity) => {
		const effect = effects.get(entity);
		if (!effect) return;
		effects.delete(entity);
		ctx.vfx.remove(effect);
	});

	const system: System = () => {
		for (const entity of reactions) {
			const effect = effects.get(entity);
			if (!effect) continue;
			ctx.vfx.move(effect, optionsOf(entity as unknown as ReactionEntity));
		}
	};

	system.dispose = () => {
		unsubscribeAdded();
		unsubscribeRemoved();
		for (const effect of effects.values()) {
			ctx.vfx.remove(effect);
		}
		effects.clear();
	};

	return system;
};
