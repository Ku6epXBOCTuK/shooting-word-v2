<script lang="ts">
	import { rewards } from "#lib/features/rewards/index.js";
	import { features } from "#lib/features/variant.js";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { onMount } from "svelte";
	import EyeIcon from "~icons/lucide/eye";
	import EyeOffIcon from "~icons/lucide/eye-off";

	let login = $state<string | null>(null);
	let widgetUuid = $state<string | null>(null);
	let unauthorized = $state(false);
	let rewardsStatus = $state<string | null>(null);
	let authorized = $state(false);
	let manageResult = $state<string | null>(null);
	let managing = $state(false);
	let rotating = $state(false);
	let copied = $state(false);
	let linkVisible = $state(false);

	const widgetLink = $derived(
		login && widgetUuid
			? `${page.url.origin}${resolve("/widget")}?uuid=${encodeURIComponent(widgetUuid)}`
			: null,
	);

	const manage = async (action: "create" | "delete") => {
		managing = true;
		manageResult = null;

		const result =
			action === "create"
				? await rewards.createRewards()
				: await rewards.deleteAllRewards();

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

	const copyLink = async () => {
		if (!widgetLink) return;

		try {
			await navigator.clipboard.writeText(widgetLink);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			manageResult = "не удалось скопировать ссылку";
		}
	};

	const rotate = async () => {
		rotating = true;
		manageResult = null;

		try {
			const response = await fetch(resolve("/api/broadcaster"), {
				method: "POST",
			});
			if (!response.ok) {
				manageResult = "не удалось сбросить ссылку";
				return;
			}
			const data = (await response.json()) as { widgetUuid: string };
			widgetUuid = data.widgetUuid;
			manageResult = "Ссылка виджета обновлена, старая больше не работает";
		} finally {
			rotating = false;
		}
	};

	onMount(async () => {
		const response = await fetch(resolve("/api/broadcaster"));
		if (!response.ok) {
			unauthorized = true;
			return;
		}
		const data = (await response.json()) as {
			login: string;
			widgetUuid?: string;
		};
		login = data.login;
		widgetUuid = data.widgetUuid ?? null;

		if (!features.rewards) return;

		const status = await rewards.status();
		authorized = status.available;
		rewardsStatus = status.available
			? "Twitch авторизован, награды доступны"
			: (status.reason ?? "награды недоступны");
	});
</script>

<main>
	<h1>shooting-word</h1>

	{#if unauthorized}
		<p class="status">
			Кабинет доступен после <a href={resolve("/auth/twitch/login")}>
				входа через Twitch
			</a>.
		</p>
	{:else}
		{#if widgetLink}
			<section>
				<h2>Виджет для OBS</h2>
				<p class="actions">
					<button
						class="icon"
						title={linkVisible ? "Скрыть" : "Показать"}
						onclick={() => {
							linkVisible = !linkVisible;
						}}
					>
						{#if linkVisible}
							<EyeOffIcon />
						{:else}
							<EyeIcon />
						{/if}
					</button>
					<button onclick={copyLink}>
						{copied ? "Скопировано" : "Скопировать ссылку"}
					</button>
					<button disabled={rotating} onclick={rotate}>
						Сбросить ссылку
					</button>
				</p>
				{#if linkVisible}
					<p class="link">{widgetLink}</p>
				{/if}
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
				{/if}
			</section>
		{/if}

		{#if manageResult}
			<p class="status">{manageResult}</p>
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
		align-items: center;
	}

	.link {
		word-break: break-all;
		font-size: 0.85rem;
		color: #7cb3ff;
	}

	button.icon {
		display: inline-flex;
		padding: 0.4rem 0.6rem;
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
