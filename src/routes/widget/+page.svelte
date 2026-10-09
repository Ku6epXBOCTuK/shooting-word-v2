<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import GameWidget from "#lib/GameWidget.svelte";
	import { parseSettings, type GameSettings } from "#lib/game/settings.js";

	const uuid = $derived(page.url.searchParams.get("uuid") ?? "");

	let login = $state<string | null>(null);
	let settings = $state<GameSettings | undefined>(undefined);
	let notFound = $state(false);

	onMount(async () => {
		settings = parseSettings(page.url.searchParams);
		try {
			const response = await fetch(
				`${resolve("/api/broadcaster")}?uuid=${encodeURIComponent(uuid)}`,
			);
			if (!response.ok) {
				notFound = true;
				return;
			}
			login = ((await response.json()) as { login: string }).login;
		} catch {
			notFound = true;
		}
	});
</script>

{#if notFound}
	<p>Неизвестная ссылка виджета.</p>
{:else if login}
	<GameWidget channel={login} {uuid} {settings} />
{/if}
