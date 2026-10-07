<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import GameWidget from "#lib/GameWidget.svelte";

	const uuid = $derived(page.params.uuid ?? "");

	let login = $state<string | null>(null);
	let notFound = $state(false);

	onMount(async () => {
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
	<GameWidget channel={login} {uuid} />
{/if}
