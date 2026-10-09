<script lang="ts">
	import PixiOverlay from "#lib/PixiOverlay.svelte";
	import { startChatFlow } from "#lib/chat/flow.js";
	import { startEffectsPolling } from "#lib/features/effects/poller.js";
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
	import { bootstrapGame } from "#lib/game/index.js";
	import type { GameSettings } from "#lib/game/settings.js";
	import { onMount } from "svelte";

	const REWARDS_POLL_INTERVAL = 10_000;

	let {
		channel,
		uuid,
		settings,
	}: { channel: string; uuid?: string; settings?: GameSettings } = $props();

	let game: Awaited<ReturnType<typeof bootstrapGame>> | null = null;

	onMount(() => {
		const stopChat = startChatFlow(() => game, channel);

		let stopPolling: (() => void) | undefined;
		if (REWARDS_ENABLED && uuid) {
			stopPolling = startEffectsPolling(
				() => game,
				uuid,
				REWARDS_POLL_INTERVAL,
			);
		}

		return () => {
			stopChat();
			stopPolling?.();
			game?.destroy();
			game = null;
		};
	});
</script>

<PixiOverlay
	onReady={(app) => {
		void bootstrapGame(app, uuid, settings).then((instance) => {
			game = instance;
		});
	}}
/>
