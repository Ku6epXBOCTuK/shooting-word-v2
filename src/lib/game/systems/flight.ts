import type { With } from "miniplex";
import { WORD_TTL, Z_NEAR } from "../config.js";
import type { Entity } from "../types.js";
import { projectPoint } from "./perspective.js";
import type { SystemFactory } from "./types.js";

export const createFlightSystem: SystemFactory = (ctx) => {
	const flying = ctx.world.with("position3", "velocity3");

	return (dt) => {
		const landed: With<Entity, "position3" | "velocity3">[] = [];

		for (const entity of flying) {
			entity.position3.x += entity.velocity3.x * dt;
			entity.position3.y += entity.velocity3.y * dt;
			entity.position3.z += entity.velocity3.z * dt;

			if (entity.position3.z <= Z_NEAR) {
				landed.push(entity);
			}
		}

		for (const entity of landed) {
			entity.position3.z = Z_NEAR;

			if (entity.position) {
				const projected = projectPoint(entity.position3, ctx.app.screen);
				entity.position.x = projected.x;
				entity.position.y = projected.y;
				entity.scale = projected.scale;
			}

			ctx.world.removeComponent(entity, "position3");
			ctx.world.removeComponent(entity, "velocity3");
			ctx.world.addComponent(entity, "lifetime", { age: 0, ttl: WORD_TTL });
		}
	};
};
