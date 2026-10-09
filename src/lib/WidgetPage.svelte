<script lang="ts">
	import { onMount } from "svelte";
	import { dev } from "$app/env";
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import GameWidget from "#lib/GameWidget.svelte";
	import { loadServerSettings } from "#lib/features/persistence/index.js";
	import {
		defaultSettings,
		parseSettings,
		type GameSettings,
	} from "#lib/game/settings.js";

	const uuid = $derived(page.url.searchParams.get("uuid") ?? "");

	let login = $state<string | null>(null);
	let settings = $state<GameSettings | undefined>(undefined);
	let notFound = $state(false);

	onMount(async () => {
		const serverSettings = uuid ? await loadServerSettings(uuid) : null;
		settings = parseSettings(
			page.url.searchParams,
			serverSettings ?? defaultSettings(),
			dev,
		);
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
