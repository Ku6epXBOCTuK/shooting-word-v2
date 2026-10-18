<script lang="ts">
	import {
		deleteAllRewards,
		deleteReward,
		listAppRewards,
		toggleReward,
		updateAllRewards,
		updateReward,
	} from "#lib/cabinet/api.ts";
	import LaunchCard from "#lib/components/LaunchCard.svelte";
	import Button from "#lib/components/ui/Button.svelte";
	import Icon from "#lib/components/ui/Icon.svelte";
	import { REWARD_CONFIGS } from "#lib/features/rewards/config.js";
	import type {
		AppRewardStatus,
		RewardValues,
	} from "#lib/features/rewards/port.js";
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
	import { untrack } from "svelte";
	import GiftIcon from "~icons/lucide/gift";
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
	let pendingDelete = $state<{ key: string | null; title: string } | null>(
		null,
	);

	const refresh = async () => {
		statuses = await listAppRewards();
	};

	const onSaveReward = async (key: string, values: RewardValues) => {
		const wasCreated = statuses.find((item) => item.key === key)?.exists;
		busy = true;
		result = null;

		const ok = await updateReward(key, values);
		result = ok
			? wasCreated
				? "Награда обновлена на Twitch"
				: "Награда создана на Twitch"
			: "Не удалось сохранить награду";
		await refresh();
		busy = false;
	};

	const onToggle = async (key: string, enabled: boolean) => {
		busy = true;
		result = null;

		const ok = await toggleReward(key, enabled);
		result = ok
			? enabled
				? "Награда включена"
				: "Награда выключена"
			: "Не удалось переключить награду";
		await refresh();
		busy = false;
	};

	const onUpdateAll = async () => {
		busy = true;
		result = null;

		const ok = await updateAllRewards();
		result = ok ? "Награды созданы на Twitch" : "Не удалось создать награды";
		await refresh();
		busy = false;
	};

	const requestDeleteAll = () => {
		pendingDelete = { key: null, title: "все награды приложения" };
	};

	const requestDelete = (key: string) => {
		const config = REWARD_CONFIGS.find((item) => item.key === key);
		pendingDelete = { key, title: config?.title ?? key };
	};

	const closeDelete = () => {
		pendingDelete = null;
	};

	const confirmDelete = async (refund: boolean) => {
		const target = pendingDelete;
		if (!target) return;

		pendingDelete = null;
		busy = true;
		result = null;

		const ok = target.key
			? await deleteReward(target.key, refund)
			: await deleteAllRewards(refund);

		result = ok
			? refund
				? "Награды удалены, баллы за невыполненные активации возвращены"
				: "Награды удалены, баллы за невыполненные активации списаны"
			: "Не удалось удалить награды";
		await refresh();
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
							Создать все
						</Button>
						<Button disabled={busy} onclick={requestDeleteAll}>
							<Icon as={TrashIcon} />
							Удалить все
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
					onDelete={requestDelete}
				/>
			{/if}
		</div>

		{#snippet bottom()}
			{#if result}
				<p class="result">{result}</p>
			{/if}
		{/snippet}

		{#if pendingDelete}
			<div class="dialog-backdrop">
				<div class="dialog" role="dialog" aria-modal="true">
					<h4 class="dialog-title">Удалить {pendingDelete.title}?</h4>
					<p class="dialog-text">
						Что сделать с баллами за невыполненные активации? При удалении
						награды Twitch иначе спишет баллы автоматически.
					</p>
					<div class="dialog-actions">
						<Button disabled={busy} onclick={() => confirmDelete(true)}>
							Вернуть баллы
						</Button>
						<Button disabled={busy} onclick={() => confirmDelete(false)}>
							Списать баллы
						</Button>
						<Button disabled={busy} onclick={closeDelete}>Отмена</Button>
					</div>
				</div>
			</div>
		{/if}
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

	.result {
		margin: 0;
		color: var(--cyan);
		font-size: 15px;
		font-weight: 700;
	}

	.dialog-backdrop {
		position: fixed;
		inset: 0;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		background: rgba(4, 6, 10, 0.72);
	}

	.dialog {
		width: min(460px, 100%);
		border: 1px solid color-mix(in srgb, var(--cyan) 40%, transparent);
		background: #0b0d12;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.dialog-title {
		font-size: 17px;
		font-weight: 700;
	}

	.dialog-text {
		color: var(--muted);
		font-size: 14px;
		line-height: 1.5;
	}

	.dialog-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.dialog-actions :global(.button) {
		padding: 10px 12px;
		font-size: 13px;
		border: 1px solid rgba(255, 255, 255, 0.18);
	}
</style>
