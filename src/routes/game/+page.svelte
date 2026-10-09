<script lang="ts">
	import { onMount } from "svelte";
	import { dev } from "$app/env";
	import { page } from "$app/state";
	import GameWidget from "#lib/GameWidget.svelte";
	import { parseSettings, type GameSettings } from "#lib/game/settings.js";

	const DEFAULT_CHANNEL = "Ku6epXBOCTuK";

	let channel = $state(DEFAULT_CHANNEL);
	let uuid = $state<string | undefined>(undefined);
	let settings = $state<GameSettings | undefined>(undefined);
	let ready = $state(false);

	onMount(() => {
		channel = page.url.searchParams.get("channel") ?? DEFAULT_CHANNEL;
		uuid = page.url.searchParams.get("uuid") ?? undefined;
		settings = parseSettings(page.url.searchParams, undefined, dev);
		ready = true;
	});
</script>

{#if ready}
	<GameWidget {channel} {uuid} {settings} />
{/if}
