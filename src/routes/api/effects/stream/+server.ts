import { broadcasters } from "#lib/server/broadcasters/index.js";
import {
	ensureRewardEffects,
	getRewardEffects,
	subscribeEffects,
	type EffectPush,
} from "#lib/server/reward-effects.js";
import type { RequestHandler } from "./$types";

export const prerender = false;

const HEARTBEAT_INTERVAL_MS = 25_000;

const encoder = new TextEncoder();
const heartbeat = encoder.encode(":\n\n");

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
	let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

	const stop = () => {
		unsubscribe?.();
		if (heartbeatTimer !== null) {
			clearInterval(heartbeatTimer);
			heartbeatTimer = null;
		}
	};

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			unsubscribe = subscribeEffects(broadcaster.userId, (push) => {
				try {
					controller.enqueue(encode(push));
				} catch {
					stop();
				}
			});
			heartbeatTimer = setInterval(() => {
				try {
					controller.enqueue(heartbeat);
				} catch {
					stop();
				}
			}, HEARTBEAT_INTERVAL_MS);
			controller.enqueue(encode(getRewardEffects(broadcaster.userId)));
			request.signal.addEventListener("abort", stop);
		},
		cancel() {
			stop();
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
