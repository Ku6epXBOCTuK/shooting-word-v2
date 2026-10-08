<script lang="ts">
	import LaunchCard from "#lib/landing/LaunchCard.svelte";
	import Button from "#lib/landing/ui/Button.svelte";
	import Icon from "#lib/landing/ui/Icon.svelte";
	import GiftIcon from "~icons/lucide/gift";
	import PlusIcon from "~icons/lucide/plus";
	import TrashIcon from "~icons/lucide/trash-2";
	import { manageRewards } from "./api.js";

	interface Props {
		authorized: boolean;
		status: string | null;
	}

	let { authorized, status }: Props = $props();

	let managing = $state(false);
	let result = $state<string | null>(null);

	const manage = async (action: "create" | "delete") => {
		managing = true;
		result = null;

		result = await manageRewards(action);

		managing = false;
	};
</script>

<LaunchCard
	variant="orange"
	title="Награды канала"
	subtitle="Активации за баллы канала"
	icon={GiftIcon}
>
	{#if status}
		<p class="status">{status}</p>
	{/if}

	{#snippet bottom()}
		{#if authorized}
			<div class="bottom-row">
				<div class="actions-row">
					<Button
						variant="pro"
						disabled={managing}
						onclick={() => manage("create")}
					>
						<Icon as={PlusIcon} />
						Создать награды
					</Button>
					<Button
						variant="pro"
						disabled={managing}
						onclick={() => manage("delete")}
					>
						<Icon as={TrashIcon} />
						Удалить награды
					</Button>
				</div>
				{#if result}
					<p class="result">{result}</p>
				{/if}
			</div>
		{/if}
	{/snippet}
</LaunchCard>

<style>
	.status {
		color: #a4a6ae;
		font-size: 17px;
		line-height: 1.6;
		margin: 12px 0 20px;
	}

	.bottom-row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: flex-start;
	}

	.actions-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.result {
		color: var(--cyan);
		font-size: 15px;
		font-weight: 700;
	}
</style>
