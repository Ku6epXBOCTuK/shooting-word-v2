<script lang="ts">
	import { saveSettings } from "#lib/cabinet/api.ts";
	import SettingsForm from "#lib/components/cabinet/SettingsForm.svelte";
	import LaunchCard from "#lib/components/LaunchCard.svelte";
	import Button from "#lib/components/ui/Button.svelte";
	import Icon from "#lib/components/ui/Icon.svelte";
	import type { GameSettings } from "#lib/game/settings.js";
	import { untrack } from "svelte";
	import SaveIcon from "~icons/lucide/save";
	import SlidersIcon from "~icons/lucide/sliders-horizontal";

	interface Props {
		initial: GameSettings;
	}

	let { initial }: Props = $props();

	let settings = $state(untrack(() => initial));

	let busy = $state(false);
	let result = $state<string | null>(null);

	async function onSaveSettings() {
		busy = true;
		result = null;

		const ok = await saveSettings($state.snapshot(settings) as GameSettings);
		result = ok
			? "Настройки сохранены, виджет подхватит их при загрузке"
			: "Не удалось сохранить настройки";

		busy = false;
	}
</script>

<LaunchCard
	variant="orange"
	title="Настройки игры"
	subtitle="Применяются к виджету автоматически"
	icon={SlidersIcon}
>
	<SettingsForm {settings} />

	{#snippet bottom()}
		<div class="bottom-row">
			<Button variant="pro" disabled={busy} onclick={onSaveSettings}>
				<Icon as={SaveIcon} />
				Сохранить
			</Button>
			{#if result}
				<p class="result">{result}</p>
			{/if}
		</div>
	{/snippet}
</LaunchCard>

<style>
	.bottom-row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: flex-start;
	}

	.result {
		color: var(--cyan);
		font-size: 15px;
		font-weight: 700;
	}
</style>
