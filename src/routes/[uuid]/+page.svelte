<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import { features } from "#lib/features/variant.js";
	import { rewards } from "#lib/features/rewards/index.js";

	const uuid = $derived(page.params.uuid ?? "");

	let login = $state<string | null>(null);
	let notFound = $state(false);
	let rewardsStatus = $state<string | null>(null);
	let authorized = $state(false);
	let manageResult = $state<string | null>(null);
	let managing = $state(false);

	const widgetLink = $derived(
		login
			? `${page.url.origin}${resolve("/game")}?channel=${encodeURIComponent(login)}&uuid=${encodeURIComponent(uuid)}`
			: null,
	);

	const manage = async (action: "create" | "delete") => {
		managing = true;
		manageResult = null;

		const result =
			action === "create"
				? await rewards.createRewards(uuid)
				: await rewards.deleteAllRewards(uuid);

		managing = false;

		if (!result.ok) {
			manageResult = result.reason ?? "ошибка";
			return;
		}

		manageResult =
			action === "create"
				? result.created.length > 0
					? `Созданы: ${result.created.join(", ")}`
					: "Все награды уже существуют"
				: `Удалено наград: ${result.deleted}`;
	};

	onMount(async () => {
		const response = await fetch(
			`${resolve("/api/broadcaster")}?uuid=${encodeURIComponent(uuid)}`,
		);
		if (!response.ok) {
			notFound = true;
			return;
		}
		login = ((await response.json()) as { login: string }).login;

		if (!features.rewards) return;

		const status = await rewards.status(uuid);
		authorized = status.available;
		rewardsStatus = status.available
			? "Twitch авторизован, награды доступны"
			: (status.reason ?? "награды недоступны");
	});
</script>

<main>
	<h1>shooting-word</h1>

	{#if notFound}
		<p class="status">
			Неизвестная ссылка. <a href={resolve("/")}>На главную</a>
		</p>
	{:else}
		{#if widgetLink}
			<section>
				<h2>Виджет для OBS</h2>
				<p>
					<a href={widgetLink}>{widgetLink}</a>
				</p>
			</section>
		{/if}

		{#if features.rewards}
			<section>
				<h2>Награды канала</h2>
				{#if rewardsStatus}
					<p class="status">{rewardsStatus}</p>
				{/if}
				{#if authorized}
					<p class="actions">
						<button disabled={managing} onclick={() => manage("create")}>
							Создать награды
						</button>
						<button disabled={managing} onclick={() => manage("delete")}>
							Удалить награды
						</button>
					</p>
					{#if manageResult}
						<p class="status">{manageResult}</p>
					{/if}
				{/if}
			</section>
		{/if}
	{/if}
</main>

<style>
	main {
		max-width: 480px;
		margin: 4rem auto;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
		color: #e8e8ec;
	}

	h1 {
		font-size: 1.5rem;
	}

	h2 {
		font-size: 1.1rem;
	}

	a {
		color: #7cb3ff;
		word-break: break-all;
	}

	.status {
		color: #9a9aa5;
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	button {
		padding: 0.4rem 0.8rem;
		border: 1px solid #3a3a44;
		border-radius: 6px;
		background: #1c1c22;
		color: inherit;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}
</style>
