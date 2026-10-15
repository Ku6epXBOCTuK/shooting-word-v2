<script lang="ts">
	import {
		SETTINGS_SCHEMA,
		type GameSettings,
		type SettingDef,
		type SettingScope,
		type SettingValue,
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

	const readValue = (def: SettingDef): SettingValue =>
		(settings as Record<string, SettingValue>)[def.key];

	const writeValue = (def: SettingDef, value: SettingValue) => {
		(settings as Record<string, SettingValue>)[def.key] = value;
	};
</script>

{#each ungrouped as def (def.key)}
	<SettingsField
		{def}
		value={readValue(def)}
		onchange={(value) => writeValue(def, value)}
	/>
{/each}

{#if devDefs.length > 0}
	<h3 class="group-title">Dev-параметры</h3>
	{#each devDefs as def (def.key)}
		<SettingsField
			{def}
			value={readValue(def)}
			onchange={(value) => writeValue(def, value)}
		/>
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
