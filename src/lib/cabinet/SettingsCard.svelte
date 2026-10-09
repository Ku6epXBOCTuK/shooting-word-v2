<script lang="ts">
	import GiftIcon from "~icons/lucide/gift";
	import SaveIcon from "~icons/lucide/save";
	import SlidersIcon from "~icons/lucide/sliders-horizontal";
	import TrashIcon from "~icons/lucide/trash-2";
	import { untrack } from "svelte";
	import type { AppRewardStatus } from "#lib/features/rewards/port.js";
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
	import type { GameSettings } from "#lib/game/settings.js";
	import LaunchCard from "#lib/landing/LaunchCard.svelte";
	import Button from "#lib/landing/ui/Button.svelte";
	import Icon from "#lib/landing/ui/Icon.svelte";
	import SettingsForm from "#lib/settings/SettingsForm.svelte";
	import RewardsEditor from "./RewardsEditor.svelte";
	import {
		listAppRewards,
		manageRewards,
		saveSettings,
		toggleReward,
	} from "./api.js";

	interface Props {
		initial: GameSettings;
		rewardsAuthorized: boolean;
		rewardsStatus: string | null;
		appRewards: AppRewardStatus[];
	}

	let { initial, rewardsAuthorized, rewardsStatus, appRewards }: Props =
		$props();

	let settings = $state(untrack(() => initial));
	let statuses = $state(untrack(() => appRewards));
	let busy = $state(false);
	let result = $state<string | null>(null);

	const save = async (): Promise<boolean> => {
		const ok = await saveSettings($state.snapshot(settings) as GameSettings);
		if (!ok) result = "не удалось сохранить настройки";
		return ok;
	};

	const onSave = async () => {
		busy = true;
		result = null;

		const ok = await save();

		busy = false;
		if (ok) {
			result = "Настройки сохранены, виджет подхватит их при загрузке";
		}
	};

	const onManage = async (action: "create" | "delete") => {
		busy = true;
		result = null;

		if (action === "create" && !(await save())) {
			busy = false;
			return;
		}

		result = await manageRewards(action);
		statuses = await listAppRewards();
		busy = false;
	};

	const onToggle = async (key: string, enabled: boolean) => {
		busy = true;
		result = null;

		if (enabled && !(await save())) {
			busy = false;
			return;
		}

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

<LaunchCard
	variant="orange"
	title="Настройки игры"
	subtitle="Применяются к виджету автоматически"
	icon={SlidersIcon}
>
	<SettingsForm {settings} flat />

	{#if REWARDS_ENABLED}
		<div class="rewards-section">
			<div class="rewards-head">
				<h3 class="rewards-title">Награды канала</h3>
				{#if rewardsAuthorized}
					<div class="rewards-bulk">
						<Button disabled={busy} onclick={() => onManage("create")}>
							<Icon as={GiftIcon} />
							Создать все награды
						</Button>
						<Button disabled={busy} onclick={() => onManage("delete")}>
							<Icon as={TrashIcon} />
							Удалить все награды
						</Button>
					</div>
				{/if}
			</div>

			{#if rewardsStatus}
				<p class="rewards-status">{rewardsStatus}</p>
			{/if}

			{#if rewardsAuthorized}
				<RewardsEditor {settings} {statuses} {busy} ontoggle={onToggle} />
			{/if}
		</div>
	{/if}

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

	.rewards-status {
		color: #a4a6ae;
		font-size: 15px;
		line-height: 1.6;
		margin: 10px 0 0;
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
