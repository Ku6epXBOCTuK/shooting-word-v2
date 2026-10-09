<script lang="ts">
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
			(def) => (!scope || def.scope === scope) && (!flat || !def.group),
		),
	);
	const ungrouped = $derived(defs.filter((def) => !def.group));
	const groups = $derived([
		...new Set(defs.map((def) => def.group).filter(Boolean)),
	] as string[]);
	const groupDefs = (group: string): SettingDef[] =>
		defs.filter((def) => def.group === group);
</script>

{#each ungrouped as def (def.key)}
	<SettingsField {def} {settings} />
{/each}

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
