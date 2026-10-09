import { broadcasters } from "#lib/server/broadcasters/index.js";
import {
	ensureRewardEffects,
	getRewardEffects,
	subscribeEffects,
	type EffectPush,
} from "#lib/server/reward-effects.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

const encoder = new TextEncoder();

function encode(push: EffectPush): Uint8Array {
	return encoder.encode(`data: ${JSON.stringify(push)}\n\n`);
}

export const GET: RequestHandler = ({ url, request }) => {
	const uuid = url.searchParams.get("uuid");
	const broadcaster = uuid ? broadcasters.byUuid(uuid) : null;

	if (!broadcaster) {
		return new Response("unknown widget", { status: 404 });
	}

	ensureRewardEffects(broadcaster);

	let unsubscribe: (() => void) | null = null;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			unsubscribe = subscribeEffects(broadcaster.userId, (push) => {
				try {
					controller.enqueue(encode(push));
				} catch {
					unsubscribe?.();
				}
			});
			controller.enqueue(encode(getRewardEffects(broadcaster.userId)));
			request.signal.addEventListener("abort", () => {
				unsubscribe?.();
			});
		},
		cancel() {
			unsubscribe?.();
		},
	});

	return new Response(stream, {
		headers: {
			"content-type": "text/event-stream",
			"cache-control": "no-cache",
			connection: "keep-alive",
			"x-accel-buffering": "no",
		},
	});
};
