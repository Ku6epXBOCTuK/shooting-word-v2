<script lang="ts">
	import {
		deleteAllRewards,
		listAppRewards,
		toggleReward,
		updateReward,
	} from "#lib/cabinet/api.ts";
	import LaunchCard from "#lib/components/LaunchCard.svelte";
	import Button from "#lib/components/ui/Button.svelte";
	import Icon from "#lib/components/ui/Icon.svelte";
	import type { AppRewardStatus } from "#lib/features/rewards/port.js";
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
	import { logger } from "#lib/logger.ts";
	import { untrack } from "svelte";
	import GiftIcon from "~icons/lucide/gift";
	import SaveIcon from "~icons/lucide/save";
	import SlidersIcon from "~icons/lucide/sliders-horizontal";
	import TrashIcon from "~icons/lucide/trash-2";
	import RewardsEditor from "./RewardsEditor.svelte";

	interface Props {
		rewardsAuthorized: boolean;
		appRewards: AppRewardStatus[];
	}

	let { rewardsAuthorized, appRewards }: Props = $props();

	let statuses = $state(untrack(() => appRewards));
	let busy = $state(false);
	let result = $state<string | null>(null);

	const onSaveReward = async (key: string) => {
		busy = true;
		result = null;

		result = (await updateReward(key))
			? "Награда обновлена"
			: "Не удалось обновить награду";
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

	function onUpdateAll() {}
	function onSave() {
		logger.info($state.snapshot(appRewards));
	}
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
					{busy}
					ontoggle={onToggle}
					onSave={onSaveReward}
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
