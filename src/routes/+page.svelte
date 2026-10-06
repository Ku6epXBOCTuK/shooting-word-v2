<script lang="ts">
	import { onMount } from "svelte";
	import PixiOverlay from "#lib/PixiOverlay.svelte";
	import { TwurpleChatAdapter } from "#lib/chat/twurple-adapter.js";
	import type { ChatPort } from "#lib/chat/port.js";

	const CHANNEL = "Ku6epXBOCTuK";

	onMount(() => {
		const chat: ChatPort = new TwurpleChatAdapter();

		chat.onMessage(({ user, text }) => {
			console.log(`[chat] ${user}: ${text}`);
		});

		chat.connect(CHANNEL);

		return () => chat.disconnect();
	});
</script>

<PixiOverlay />
