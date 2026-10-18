<script lang="ts">
	import {
		claimWidget,
		getOrCreateWidgetKey,
	} from "#lib/features/widget/key.js";
	import {
		settingsLoad,
		widgetLogin,
	} from "#lib/features/widget/widget.remote.js";
	import {
		defaultSettings,
		parseSettings,
		type GameSettings,
	} from "#lib/game/settings.js";
	import { dev } from "$app/env";
	import { page } from "$app/state";
	import { onMount } from "svelte";
	import GameWidget from "./GameWidget.svelte";

	const uuid = $derived(page.url.searchParams.get("uuid") ?? "");

	let login = $state<string | null>(null);
	let key = $state<string | null>(null);
	let settings = $state<GameSettings | undefined>(undefined);
	let blocked = $state<"notFound" | "busy" | "unavailable" | null>(null);

	onMount(async () => {
		if (uuid) {
			const claim = await claimWidget(uuid, getOrCreateWidgetKey(uuid));
			if (claim === "duplicate") {
				blocked = "busy";
				return;
			}
			if (claim === "notFound") {
				blocked = "notFound";
				return;
			}
			if (claim === "unavailable") {
				blocked = "unavailable";
				return;
			}
			key = getOrCreateWidgetKey(uuid);
		}

		let serverSettings: GameSettings | null = null;
		if (uuid && key) {
			serverSettings = await settingsLoad({ uuid, key }).catch(() => null);
		}
		settings = parseSettings(
			page.url.searchParams,
			serverSettings ?? defaultSettings(),
			dev,
		);
		try {
			const session = await widgetLogin({ uuid });
			if (!session) {
				blocked = "notFound";
				return;
			}
			login = session.login;
		} catch {
			blocked = "unavailable";
		}
	});
</script>

{#if blocked === "notFound"}
	<p>Неизвестная ссылка виджета.</p>
{:else if blocked === "busy"}
	<p>Ссылка уже занята. Перегенерируйте её в кабинете командира.</p>
{:else if blocked === "unavailable"}
	<p>Сервер недоступен. Попробуйте открыть виджет позже.</p>
{:else if login}
	<GameWidget channel={login} {uuid} {settings} key={key ?? undefined} />
{/if}
