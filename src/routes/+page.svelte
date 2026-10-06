<script lang="ts">
	import { onMount } from "svelte";
	import PixiOverlay from "#lib/PixiOverlay.svelte";
	import { TwurpleChatAdapter } from "#lib/chat/twurple-adapter.js";
	import type { ChatPort } from "#lib/chat/port.js";
	import { bootstrapGame } from "#lib/game/index.js";

	const CHANNEL = "Ku6epXBOCTuK";

	let game: Awaited<ReturnType<typeof bootstrapGame>> | null = null;

	onMount(() => {
		const chat: ChatPort = new TwurpleChatAdapter();

		chat.onMessage((message) => {
			game?.joinViewer({ userId: message.userId, user: message.user });

			const text = message.text.trim();
			if (text.startsWith("!скин")) {
				const argument = text.slice("!скин".length).trim();
				const skin = Number.parseInt(argument, 10);
				game?.changeSkin(message.userId, Number.isNaN(skin) ? undefined : skin);
				return;
			}

			game?.shoot(message);
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
		void bootstrapGame(app).then((instance) => {
			game = instance;
		});
	}}
/>
