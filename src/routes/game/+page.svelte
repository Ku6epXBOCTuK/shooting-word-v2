<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import GameWidget from "#lib/GameWidget.svelte";

	const DEFAULT_CHANNEL = "Ku6epXBOCTuK";

	let channel = $state(DEFAULT_CHANNEL);
	let uuid = $state<string | undefined>(undefined);
	let ready = $state(false);

	onMount(() => {
		channel = page.url.searchParams.get("channel") ?? DEFAULT_CHANNEL;
		uuid = page.url.searchParams.get("uuid") ?? undefined;
		ready = true;
	});
</script>

{#if ready}
	<GameWidget {channel} {uuid} />
{/if}
