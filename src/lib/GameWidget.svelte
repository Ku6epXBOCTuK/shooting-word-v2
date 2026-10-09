<script lang="ts">
	import PixiOverlay from "#lib/PixiOverlay.svelte";
	import { startChatFlow } from "#lib/chat/flow.js";
	import { startEffectsStream } from "#lib/features/effects/stream.js";
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
	import { bootstrapGame } from "#lib/game/index.js";
	import type { GameSettings } from "#lib/game/settings.js";
	import { onMount } from "svelte";

	let {
		channel,
		uuid,
		settings,
	}: { channel: string; uuid?: string; settings?: GameSettings } = $props();

	let game: Awaited<ReturnType<typeof bootstrapGame>> | null = null;
	let stopStream: (() => void) | undefined;

	onMount(() => {
		const stopChat = startChatFlow(() => game, channel);

		return () => {
			stopChat();
			stopStream?.();
			game?.destroy();
			game = null;
		};
	});
</script>

<PixiOverlay
	onReady={(app) => {
		void bootstrapGame(app, uuid, settings).then((instance) => {
			game = instance;
			if (REWARDS_ENABLED && uuid) {
				stopStream = startEffectsStream(instance, uuid);
			}
		});
	}}
/>
