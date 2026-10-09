<script lang="ts">
	import { dev } from "$app/env";
	import {
		SETTING_GROUPS,
		SETTINGS_SCHEMA,
		type GameSettings,
		type SettingDef,
		type SettingScope,
	} from "#lib/game/settings.js";
	import SettingsField from "./SettingsField.svelte";

	interface Props {
		settings: GameSettings;
		scope?: SettingScope;
		flat?: boolean;
	}

	let { settings, scope, flat = false }: Props = $props();

	const defs = $derived(
		SETTINGS_SCHEMA.filter(
			(def) =>
				(!scope || def.scope === scope) &&
				(!flat || !def.group) &&
				(!def.dev || dev),
		),
	);
	const ungrouped = $derived(defs.filter((def) => !def.group && !def.dev));
	const devDefs = $derived(defs.filter((def) => def.dev));
	const groups = $derived([
		...new Set(defs.map((def) => def.group).filter(Boolean)),
	] as string[]);
	const groupDefs = (group: string): SettingDef[] =>
		defs.filter((def) => def.group === group);
</script>

{#each ungrouped as def (def.key)}
	<SettingsField {def} {settings} />
{/each}

{#if devDefs.length > 0}
	<h3 class="group-title">Dev-параметры</h3>
	{#each devDefs as def (def.key)}
		<SettingsField {def} {settings} />
	{/each}
{/if}

{#each groups as group (group)}
	<h3 class="group-title">{SETTING_GROUPS[group] ?? group}</h3>
	{#each groupDefs(group) as def (def.key)}
		<SettingsField {def} {settings} />
	{/each}
{/each}

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
