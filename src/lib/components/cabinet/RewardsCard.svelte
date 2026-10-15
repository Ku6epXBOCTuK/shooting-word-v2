<script lang="ts">
	import {
		deleteAllRewards,
		importReward,
		listAppRewards,
		saveRewards,
		toggleReward,
		updateAllRewards,
		updateReward,
	} from "#lib/cabinet/api.ts";
	import LaunchCard from "#lib/components/LaunchCard.svelte";
	import Button from "#lib/components/ui/Button.svelte";
	import Icon from "#lib/components/ui/Icon.svelte";
	import type { AppRewardStatus } from "#lib/features/rewards/port.js";
	import type {
		RewardOverrides,
		RewardSettings,
	} from "#lib/features/rewards/settings.js";
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
	import type { SettingValue } from "#lib/game/settings.js";
	import { untrack } from "svelte";
	import GiftIcon from "~icons/lucide/gift";
	import SaveIcon from "~icons/lucide/save";
	import SlidersIcon from "~icons/lucide/sliders-horizontal";
	import TrashIcon from "~icons/lucide/trash-2";
	import RewardsEditor from "./RewardsEditor.svelte";

	interface Props {
		rewardsAuthorized: boolean;
		appRewards: AppRewardStatus[];
		rewards: RewardSettings;
	}

	let { rewardsAuthorized, appRewards, rewards }: Props = $props();

	let statuses = $state(untrack(() => appRewards));
	let rewardSettings = $state<RewardSettings>(untrack(() => rewards));
	let busy = $state(false);
	let result = $state<string | null>(null);

	const onFieldChange = (
		key: string,
		field: keyof RewardOverrides,
		value: SettingValue,
	) => {
		const current = rewardSettings[key as keyof RewardSettings] ?? {};
		rewardSettings = {
			...rewardSettings,
			[key]: { ...current, [field]: value },
		};
	};

	const onImport = async (key: string) => {
		busy = true;
		result = null;

		const res = await importReward(key);
		if (!res.ok || !res.overrides) {
			result = res.reason ?? "Не удалось забрать значения из Twitch";
			busy = false;
			return;
		}

		rewardSettings = {
			...rewardSettings,
			[key]: { ...res.overrides },
		};
		const saved = await saveRewards(rewardSettings);
		statuses = await listAppRewards();
		result = saved
			? "Значения забраны из Twitch и сохранены"
			: "Значения забраны, но не сохранены";
		busy = false;
	};

	const onSaveReward = async (key: string) => {
		busy = true;
		result = null;

		const saved = await saveRewards(rewardSettings);
		const pushed = saved ? await updateReward(key) : false;
		result =
			saved && pushed
				? "Награда сохранена и обновлена"
				: "Не удалось сохранить награду";
		statuses = await listAppRewards();
		busy = false;
	};

	const onDeleteAll = async () => {
		busy = true;
		result = null;

		const ok = await deleteAllRewards();
		if (!ok) {
			result = "не удалось удалить награды";
		}
		busy = false;
	};

	const onUpdateAll = async () => {
		busy = true;
		result = null;

		const ok = await updateAllRewards();
		result = ok ? "Награды обновлены" : "Не удалось обновить награды";
		statuses = await listAppRewards();
		busy = false;
	};

	const onSave = async () => {
		busy = true;
		result = null;

		const ok = await saveRewards(rewardSettings);
		result = ok
			? "Настройки наград сохранены"
			: "Не удалось сохранить настройки наград";
		busy = false;
	};

	const onToggle = async (key: string, enabled: boolean) => {
		busy = true;
		result = null;

		const ok = await toggleReward(key, enabled);
		if (ok) {
			statuses = statuses.map((item) =>
				item.key === key ? { ...item, exists: true, enabled } : item,
			);
			result = enabled ? "Награда включена" : "Награда выключена";
		} else {
			result = "не удалось переключить награду";
		}
		busy = false;
	};
</script>

{#if REWARDS_ENABLED}
	<LaunchCard
		variant="cyan"
		title="Настройки наград"
		subtitle=""
		icon={SlidersIcon}
	>
		<div class="rewards-section">
			<div class="rewards-head">
				<h3 class="rewards-title">Награды канала</h3>
				{#if rewardsAuthorized}
					<div class="rewards-bulk">
						<Button disabled={busy} onclick={onUpdateAll}>
							<Icon as={GiftIcon} />
							Создать все награды
						</Button>
						<Button disabled={busy} onclick={onDeleteAll}>
							<Icon as={TrashIcon} />
							Удалить все награды
						</Button>
					</div>
				{/if}
			</div>

			{#if rewardsAuthorized}
				<RewardsEditor
					{statuses}
					{rewards}
					{busy}
					ontoggle={onToggle}
					onSave={onSaveReward}
					{onFieldChange}
					{onImport}
				/>
			{/if}
		</div>

		{#snippet bottom()}
			<div class="bottom-row">
				<Button variant="pro" disabled={busy} onclick={onSave}>
					<Icon as={SaveIcon} />
					Сохранить
				</Button>
				{#if result}
					<p class="result">{result}</p>
				{/if}
			</div>
		{/snippet}
	</LaunchCard>
{/if}

<style>
	.rewards-section {
		margin-top: 22px;
		padding-top: 16px;
		border-top: 1px solid var(--line, rgba(255, 255, 255, 0.11));
	}

	.rewards-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}

	.rewards-title {
		font-size: 18px;
		font-weight: 700;
	}

	.rewards-bulk {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.rewards-bulk :global(.button) {
		padding: 10px 12px;
		font-size: 13px;
		border: 1px solid rgba(255, 255, 255, 0.18);
	}

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
