<script lang="ts">
	import SettingsField from "#lib/components/cabinet/SettingsField.svelte";
	import Button from "#lib/components/ui/Button.svelte";
	import Icon from "#lib/components/ui/Icon.svelte";
	import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
	import type { AppRewardStatus } from "#lib/features/rewards/port.js";
	import {
		REWARDS_SCHEMA,
		type RewardOverrides,
		type RewardSettings,
	} from "#lib/features/rewards/settings.js";
	import type { SettingValue } from "#lib/game/settings.js";
	import DownloadIcon from "~icons/lucide/download";
	import SaveIcon from "~icons/lucide/notebook-pen";
	import EditIcon from "~icons/lucide/pencil";
	import ToggleIcon from "~icons/lucide/power";

	type RewardConfig = (typeof REWARD_CONFIGS)[number];

	interface Props {
		statuses: AppRewardStatus[];
		rewards: RewardSettings;
		busy: boolean;
		ontoggle: (key: string, enabled: boolean) => void;
		onSave: (key: string) => void;
		onImport: (key: string) => void;
		onFieldChange: (
			key: string,
			field: keyof RewardOverrides,
			value: SettingValue,
		) => void;
	}

	let {
		statuses,
		rewards,
		busy,
		ontoggle,
		onSave,
		onImport,
		onFieldChange,
	}: Props = $props();

	let expanded = $state<string | null>(null);

	const statusOf = (key: string): AppRewardStatus =>
		statuses.find((item) => item.key === key) ?? {
			key,
			exists: false,
			enabled: false,
		};

	const statusLabel = (status: AppRewardStatus): string =>
		!status.exists ? "не создана" : status.enabled ? "включена" : "выключена";

	const fieldValue = (
		reward: RewardConfig,
		field: keyof RewardOverrides,
	): SettingValue => {
		const override = rewards[reward.key as keyof RewardSettings]?.[field];
		return override !== undefined ? override : reward[field];
	};
</script>

<div class="rewards">
	{#each REWARD_CONFIGS as reward (reward.key)}
		{@const status = statusOf(reward.key)}
		{@const isExpanded = expanded === reward.key}
		<div class="reward" class:reward-open={isExpanded}>
			<div class="reward-row">
				<span class="reward-title">
					{reward.title}
				</span>
				<span
					class="reward-status"
					class:status-on={status.exists && status.enabled}
					class:status-off={status.exists && !status.enabled}
				>
					{statusLabel(status)}
				</span>
				{#if status.exists && status.diverged}
					<span
						class="reward-diverged"
						title="Значения на Twitch отличаются от ваших — нажмите «Забрать из Twitch» или «Сохранить»"
					>
						расходится
					</span>
				{/if}
				<div class="reward-actions">
					<Button
						disabled={busy}
						onclick={() => ontoggle(reward.key, !status.enabled)}
					>
						<Icon as={ToggleIcon} />
						{status.enabled ? "Выключить" : "Включить"}
					</Button>
					<Button disabled={busy} onclick={() => onSave(reward.key)}>
						<Icon as={SaveIcon} />
						Сохранить
					</Button>
					<Button
						disabled={busy || !status.exists}
						onclick={() => onImport(reward.key)}
					>
						<Icon as={DownloadIcon} />
						Забрать из Twitch
					</Button>
					<Button
						disabled={busy}
						onclick={() => {
							expanded = isExpanded ? null : reward.key;
						}}
					>
						<Icon as={EditIcon} />
						Редактировать
					</Button>
				</div>
			</div>
			{#if isExpanded}
				<div class="reward-fields">
					{#each REWARDS_SCHEMA as def (def.key)}
						<SettingsField
							{def}
							value={fieldValue(reward, def.key as keyof RewardOverrides)}
							onchange={(value) =>
								onFieldChange(
									reward.key,
									def.key as keyof RewardOverrides,
									value,
								)}
						/>
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

	.reward-diverged {
		font-size: 12px;
		font-weight: 700;
		color: var(--orange);
		border: 1px solid color-mix(in srgb, var(--orange) 45%, transparent);
		background: color-mix(in srgb, var(--orange) 12%, transparent);
		border-radius: 999px;
		padding: 3px 9px;
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
