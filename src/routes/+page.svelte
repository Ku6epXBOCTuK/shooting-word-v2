<script lang="ts">
	import { onMount } from "svelte";
	import PixiOverlay from "#lib/PixiOverlay.svelte";
	import { connectChat } from "#lib/twitch.js";

	onMount(() => {
		const channel = new URLSearchParams(window.location.search).get("channel");
		if (!channel) return;

		const disconnect = connectChat(channel, (_channel, user, text) => {
			console.log(`[chat] ${user}: ${text}`);
		});

		return disconnect;
	});
</script>

<PixiOverlay />
