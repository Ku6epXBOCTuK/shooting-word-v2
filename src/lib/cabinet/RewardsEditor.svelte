<script lang="ts">
	import PencilIcon from "~icons/lucide/pencil";
	import PowerIcon from "~icons/lucide/power";
	import type { AppRewardStatus } from "#lib/features/rewards/port.js";
	import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
	import {
		SETTING_GROUPS,
		SETTINGS_SCHEMA,
		type GameSettings,
	} from "#lib/game/settings.js";
	import Button from "#lib/landing/ui/Button.svelte";
	import Icon from "#lib/landing/ui/Icon.svelte";
	import SettingsField from "#lib/settings/SettingsField.svelte";

	interface Props {
		settings: GameSettings;
		statuses: AppRewardStatus[];
		busy: boolean;
		ontoggle: (key: string, enabled: boolean) => void;
	}

	let { settings, statuses, busy, ontoggle }: Props = $props();

	let expanded = $state<string | null>(null);

	const groupDefs = (key: string) =>
		SETTINGS_SCHEMA.filter((def) => def.group === `reward:${key}`);

	const statusOf = (key: string): AppRewardStatus =>
		statuses.find((item) => item.key === key) ?? {
			key,
			exists: false,
			enabled: false,
		};

	const statusLabel = (status: AppRewardStatus): string =>
		!status.exists ? "не создана" : status.enabled ? "включена" : "выключена";
</script>

<div class="rewards">
	{#each REWARD_CONFIGS as reward (reward.key)}
		{@const status = statusOf(reward.key)}
		{@const isExpanded = expanded === reward.key}
		<div class="reward" class:reward-open={isExpanded}>
			<div class="reward-row">
				<span class="reward-title">
					{SETTING_GROUPS[`reward:${reward.key}`] ?? reward.title}
				</span>
				<span
					class="reward-status"
					class:status-on={status.exists && status.enabled}
					class:status-off={status.exists && !status.enabled}
				>
					{statusLabel(status)}
				</span>
				<div class="reward-actions">
					<Button
						disabled={busy}
						onclick={() => ontoggle(reward.key, !status.enabled)}
					>
						<Icon as={PowerIcon} />
						{status.enabled ? "Выключить" : "Включить"}
					</Button>
					<Button
						disabled={busy}
						onclick={() => {
							expanded = isExpanded ? null : reward.key;
						}}
					>
						<Icon as={PencilIcon} />
						Редактировать
					</Button>
				</div>
			</div>
			{#if isExpanded}
				<div class="reward-fields">
					{#each groupDefs(reward.key) as def (def.key)}
						<SettingsField {def} {settings} />
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.rewards {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 14px;
	}

	.reward {
		border: 1px solid rgba(255, 255, 255, 0.14);
		background: rgba(11, 13, 18, 0.6);
		padding: 12px 14px;
	}

	.reward-open {
		border-color: color-mix(in srgb, var(--cyan) 38%, transparent);
	}

	.reward-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.reward-title {
		font-weight: 700;
		font-size: 16px;
	}

	.reward-status {
		font-size: 13px;
		color: var(--muted);
	}

	.status-on {
		color: var(--cyan);
	}

	.status-off {
		color: var(--orange);
	}

	.reward-actions {
		display: flex;
		gap: 8px;
		margin-left: auto;
	}

	.reward-actions :global(.button) {
		padding: 10px 12px;
		font-size: 13px;
		border: 1px solid rgba(255, 255, 255, 0.18);
	}

	.reward-fields {
		margin-top: 10px;
		padding-top: 6px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
	}
</style>
