<script lang="ts">
	import {
		readSetting,
		SETTINGS_SCHEMA,
		writeSetting,
		type GameSettings,
		type SettingDef,
		type SettingScope,
	} from "#lib/game/settings.js";
	import { dev } from "$app/env";
	import SettingsField from "./SettingsField.svelte";

	interface Props {
		settings: GameSettings;
		scope?: SettingScope;
	}

	let { settings, scope }: Props = $props();

	const defs = $derived(
		SETTINGS_SCHEMA.filter(
			(def) => (!scope || def.scope === scope) && (!def.dev || dev),
		),
	);
	const ungrouped = $derived(defs.filter((def) => !def.dev));
	const devDefs = $derived(defs.filter((def) => def.dev));
</script>

{#snippet field(def: SettingDef)}
	<SettingsField
		{def}
		value={readSetting(settings, def)}
		onchange={(value) => writeSetting(settings, def, value)}
	/>
{/snippet}

{#each ungrouped as def (def.key)}
	{@render field(def)}
{/each}

{#if devDefs.length > 0}
	<h3 class="group-title">Dev-параметры</h3>
	{#each devDefs as def (def.key)}
		{@render field(def)}
	{/each}
{/if}

<style>
	.group-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--foreground);
		margin: 22px 0 4px;
		padding-top: 16px;
		border-top: 1px solid var(--line, rgba(255, 255, 255, 0.11));
	}
</style>
