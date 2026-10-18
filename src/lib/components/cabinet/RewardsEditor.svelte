<script lang="ts">
	import SettingsField from "#lib/components/cabinet/SettingsField.svelte";
	import Button from "#lib/components/ui/Button.svelte";
	import Icon from "#lib/components/ui/Icon.svelte";
	import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
	import type {
		AppRewardStatus,
		RewardValues,
	} from "#lib/features/rewards/port.js";
	import {
		defaultRewardValues,
		REWARDS_SCHEMA,
	} from "#lib/features/rewards/settings.js";
	import type { SettingValue } from "#lib/game/settings.js";
	import GiftIcon from "~icons/lucide/gift";
	import SaveIcon from "~icons/lucide/notebook-pen";
	import EditIcon from "~icons/lucide/pencil";
	import ToggleIcon from "~icons/lucide/power";
	import TrashIcon from "~icons/lucide/trash-2";

	interface Props {
		statuses: AppRewardStatus[];
		busy: boolean;
		ontoggle: (key: string, enabled: boolean) => void;
		onSave: (key: string, values: RewardValues) => void | Promise<void>;
		onDelete: (key: string) => void;
	}

	let { statuses, busy, ontoggle, onSave, onDelete }: Props = $props();

	let expanded = $state<string | null>(null);
	let drafts = $state<Record<string, Partial<RewardValues>>>({});

	const statusOf = (key: string): AppRewardStatus =>
		statuses.find((item) => item.key === key) ?? {
			key,
			exists: false,
			enabled: false,
		};

	const valuesOf = (key: string): RewardValues => {
		const status = statusOf(key);
		const base = status.live ?? defaultRewardValues(key);
		return { ...base, ...drafts[key] };
	};

	const setField = (
		key: string,
		field: keyof RewardValues,
		value: SettingValue,
	) => {
		const next: Partial<RewardValues> = { ...drafts[key] };
		(next as Record<string, SettingValue>)[field] = value;
		drafts = { ...drafts, [key]: next };
	};

	const save = async (key: string) => {
		await onSave(key, valuesOf(key));
		const next = { ...drafts };
		delete next[key];
		drafts = next;
	};
</script>

<div class="rewards">
	{#each REWARD_CONFIGS as reward (reward.key)}
		{@const status = statusOf(reward.key)}
		{@const isExpanded = expanded === reward.key}
		{@const values = valuesOf(reward.key)}
		<div class="reward" class:reward-open={isExpanded}>
			<div class="reward-row">
				<span class="reward-title">
					{values.title}
				</span>
				{#if status.exists}
					<span
						class="reward-status"
						class:status-on={status.enabled}
						class:status-off={!status.enabled}
					>
						{status.enabled ? "включена" : "выключена"}
					</span>
				{/if}
				<div class="reward-actions">
					{#if status.exists}
						<Button
							disabled={busy}
							onclick={() => ontoggle(reward.key, !status.enabled)}
						>
							<Icon as={ToggleIcon} />
							{status.enabled ? "Выключить" : "Включить"}
						</Button>
						<Button disabled={busy} onclick={() => save(reward.key)}>
							<Icon as={SaveIcon} />
							Сохранить
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
						<Button disabled={busy} onclick={() => onDelete(reward.key)}>
							<Icon as={TrashIcon} />
							Удалить
						</Button>
					{:else}
						<Button disabled={busy} onclick={() => save(reward.key)}>
							<Icon as={GiftIcon} />
							Создать
						</Button>
						<Button
							disabled={busy}
							onclick={() => {
								expanded = isExpanded ? null : reward.key;
							}}
						>
							<Icon as={EditIcon} />
							Изменить
						</Button>
					{/if}
				</div>
			</div>
			{#if isExpanded}
				<div class="reward-fields">
					{#each REWARDS_SCHEMA as def (def.key)}
						<SettingsField
							{def}
							value={(values as unknown as Record<string, SettingValue>)[
								def.key
							]}
							onchange={(value) =>
								setField(reward.key, def.key as keyof RewardValues, value)}
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
