<script lang="ts">
	import { onMount } from "svelte";
	import PixiOverlay from "#lib/PixiOverlay.svelte";
	import { TwurpleChatAdapter } from "#lib/chat/twurple-adapter.js";
	import type { ChatPort } from "#lib/chat/port.js";
	import { bootstrapGame } from "#lib/game/index.js";

	const CHANNEL = "Ku6epXBOCTuK";

	let game: ReturnType<typeof bootstrapGame> | null = null;

	onMount(() => {
		const chat: ChatPort = new TwurpleChatAdapter();

		chat.onMessage((message) => {
			game?.joinViewer({ userId: message.userId, user: message.user });
		});
		chat.connect(CHANNEL);

		return () => {
			chat.disconnect();
			game?.destroy();
			game = null;
		};
	});
</script>

<PixiOverlay
	onReady={(app) => {
		game = bootstrapGame(app);
	}}
/>
