import { REACTION_DURATION } from "#lib/vfx/durations.js";
import type { ReactionKind } from "#lib/vfx/kinds.js";
import type { GameContext } from "./context.js";
import type { Position } from "./types.js";

// NOTE: ttl comes from the kind table, which keeps this logic headless: the
// render system only reads vfx.kind when it draws.
export function addReaction(
	ctx: GameContext,
	at: Position,
	kind: ReactionKind,
	value?: number,
): void {
	ctx.world.add({
		position: { x: at.x, y: at.y },
		vfx: { kind, age: 0, ttl: REACTION_DURATION[kind], value },
	});
}
