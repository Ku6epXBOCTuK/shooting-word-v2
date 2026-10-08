<script lang="ts">
	import CopyIcon from "~icons/lucide/copy";
	import CheckIcon from "~icons/lucide/check";
	import EyeIcon from "~icons/lucide/eye";
	import EyeOffIcon from "~icons/lucide/eye-off";
	import GiftIcon from "~icons/lucide/gift";
	import LogOutIcon from "~icons/lucide/log-out";
	import MonitorPlayIcon from "~icons/lucide/monitor-play";
	import PlusIcon from "~icons/lucide/plus";
	import RefreshCwIcon from "~icons/lucide/refresh-cw";
	import TrashIcon from "~icons/lucide/trash-2";
	import { onMount } from "svelte";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import { rewards } from "#lib/features/rewards/index.js";
	import { features } from "#lib/features/variant.js";
	import LaunchCard from "#lib/landing/LaunchCard.svelte";
	import Button from "#lib/landing/ui/Button.svelte";
	import CopyField from "#lib/landing/ui/CopyField.svelte";
	import FieldLabel from "#lib/landing/ui/FieldLabel.svelte";
	import Icon from "#lib/landing/ui/Icon.svelte";

	let login = $state<string | null>(null);
	let displayName = $state<string | null>(null);
	let widgetUuid = $state<string | null>(null);
	let unauthorized = $state(false);
	let rewardsStatus = $state<string | null>(null);
	let authorized = $state(false);
	let manageResult = $state<string | null>(null);
	let managing = $state(false);
	let rotating = $state(false);
	let copied = $state(false);
	let linkVisible = $state(false);
	let loading = $state(true);

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

	const copyHidden = async () => {
		if (!widgetLink) return;

		await navigator.clipboard.writeText(widgetLink);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1800);
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
			loading = false;
			return;
		}
		const data = (await response.json()) as {
			login: string;
			displayName?: string | null;
			widgetUuid?: string;
		};
		login = data.login;
		displayName = data.displayName ?? data.login;
		widgetUuid = data.widgetUuid ?? null;

		if (!features.rewards) {
			loading = false;
			return;
		}

		const status = await rewards.status();
		authorized = status.available;
		rewardsStatus = status.available
			? "Twitch авторизован, награды доступны"
			: (status.reason ?? "награды недоступны");
		loading = false;
	});
</script>

<svelte:head>
	<title>Кабинет командира — Shooting Word</title>
</svelte:head>

<div class="scene">
	<main class="shell">
		<div class="noise" aria-hidden="true"></div>
		<div class="star-field" aria-hidden="true"></div>

		<div class="content">
			<header class="topbar">
				<a class="brand" href={resolve("/")}>Shooting Word</a>
				{#if login}
					<div class="identity">
						<span class="login-chip">{displayName}</span>
						<a class="logout" href={resolve("/auth/twitch/logout")}>
							<Icon as={LogOutIcon} />
							выйти
						</a>
					</div>
				{/if}
			</header>

			<h1>Кабинет <em>командира</em></h1>

			{#if loading}
				<p class="loading">Загрузка кабинета…</p>
			{:else if unauthorized}
				<div class="cards">
					<LaunchCard
						variant="orange"
						title="Вход для командира"
						subtitle="Кабинет открывается после авторизации"
						icon={GiftIcon}
					>
						<p class="lede">
							Управление виджетом и наградами канала привязано к твоему
							Twitch-аккаунту.
						</p>
						{#snippet bottom()}
							<Button variant="pro" href={resolve("/auth/twitch/login")}>
								Войти через Twitch
							</Button>
						{/snippet}
					</LaunchCard>
				</div>
			{:else}
				<div class="cards">
					{#if widgetLink}
						<LaunchCard
							variant="cyan"
							title="Виджет для OBS"
							subtitle="Browser source для трансляции"
							icon={MonitorPlayIcon}
						>
							<FieldLabel>ссылка виджета</FieldLabel>
							<div class="link-row">
								<button
									class="square-button"
									type="button"
									title={linkVisible ? "Скрыть" : "Показать"}
									onclick={() => {
										linkVisible = !linkVisible;
									}}
								>
									<Icon as={linkVisible ? EyeOffIcon : EyeIcon} size="md" />
								</button>
								{#if linkVisible}
									<CopyField value={widgetLink} />
								{:else}
									<div class="masked-field">
										<span class="masked-dots">••••••••••••••••••••••</span>
										<button
											class="square-button"
											type="button"
											aria-label="Скопировать ссылку"
											onclick={copyHidden}
										>
											<Icon as={copied ? CheckIcon : CopyIcon} />
										</button>
									</div>
								{/if}
							</div>

							{#snippet bottom()}
								<Button variant="pro" disabled={rotating} onclick={rotate}>
									<Icon as={RefreshCwIcon} />
									Сбросить ссылку
								</Button>
							{/snippet}
						</LaunchCard>
					{/if}

					{#if features.rewards}
						<LaunchCard
							variant="orange"
							title="Награды канала"
							subtitle="Активации за баллы канала"
							icon={GiftIcon}
						>
							{#if rewardsStatus}
								<p class="status">{rewardsStatus}</p>
							{/if}

							{#snippet bottom()}
								{#if authorized}
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
								{/if}
							{/snippet}
						</LaunchCard>
					{/if}
				</div>

				{#if manageResult}
					<p class="result">{manageResult}</p>
				{/if}
			{/if}
		</div>
	</main>
</div>

<style>
	.scene {
		--background: #08090d;
		--foreground: #ecebe7;
		--muted: #8b8e98;
		--line: rgba(255, 255, 255, 0.11);
		--panel: oklch(27% 0.02 272.464 / 0.86);
		--lime: #caff42;
		--cyan: #69d8e6;
		--orange: #ff7042;
		position: fixed;
		inset: 0;
		overflow-y: auto;
		background: var(--background);
		color: var(--foreground);
		font-family: Arial, Helvetica, sans-serif;
	}

	.shell {
		min-height: 100vh;
		position: relative;
		isolation: isolate;
		background:
			radial-gradient(
				circle at 74% 16%,
				rgba(43, 77, 86, 0.22),
				transparent 29rem
			),
			#08090d;
	}

	.content {
		width: min(1440px, calc(100% - 48px));
		margin-inline: auto;
		padding: 32px 0 74px;
	}

	.noise {
		position: fixed;
		inset: 0;
		z-index: -1;
		opacity: 0.035;
		pointer-events: none;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E");
	}

	.star-field {
		position: absolute;
		z-index: -1;
		inset: 0;
		opacity: 0.34;
		background-image:
			radial-gradient(circle, rgba(255, 255, 255, 0.72) 0 1px, transparent 1px),
			radial-gradient(
				circle,
				color-mix(in srgb, var(--cyan) 55%, transparent) 0 1px,
				transparent 1px
			);
		background-size:
			83px 97px,
			137px 151px;
		background-position:
			12px 16px,
			52px 71px;
		mask-image: linear-gradient(to bottom, black, transparent 80%);
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.brand {
		color: var(--foreground);
		text-decoration: none;
		font-weight: 700;
		font-size: 18px;
		letter-spacing: -0.02em;
	}

	.identity {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.login-chip {
		border: 1px solid color-mix(in srgb, var(--cyan) 38%, transparent);
		background: color-mix(in srgb, var(--cyan) 7%, transparent);
		color: var(--cyan);
		padding: 8px 14px;
		font-size: 15px;
		font-weight: 700;
	}

	.logout {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
		text-decoration: none;
		font-size: 15px;
		transition: color 0.2s;
	}

	.logout:hover {
		color: var(--foreground);
	}

	h1 {
		font-size: clamp(38px, 4.5vw, 56px);
		letter-spacing: -0.05em;
		margin: 48px 0 36px;
		font-weight: 700;
	}

	h1 em {
		font-style: normal;
		color: var(--cyan);
	}

	.cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		align-items: stretch;
	}

	.content :global(.launch-card) {
		padding: 34px;
	}

	.content :global(.launch-card h2) {
		font-size: 34px;
	}

	.content :global(.card-subtitle) {
		font-size: 18px;
	}

	.content :global(.field-label) {
		font-size: 14px;
	}

	.content :global(.button) {
		font-size: 16px;
		padding: 18px 20px;
	}

	.content :global(.copy-field-input) {
		font-size: 15px;
		padding: 14px;
	}

	.content :global(.copy-field-button) {
		width: 48px;
	}

	.link-row {
		display: flex;
		align-items: stretch;
		gap: 8px;
	}

	.link-row :global(.copy-field) {
		flex: 1;
		min-width: 0;
		margin-top: 0;
	}

	.square-button {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 48px;
		background: #0b0d12;
		color: var(--muted);
		border: 1px solid rgba(255, 255, 255, 0.18);
		cursor: pointer;
		transition:
			color 0.2s,
			border-color 0.2s;
	}

	.square-button:hover {
		color: var(--foreground);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.masked-field {
		flex: 1;
		min-width: 0;
		display: flex;
		background: #0b0d12;
		border: 1px solid rgba(255, 255, 255, 0.18);
	}

	.masked-dots {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		padding: 14px;
		color: var(--muted);
		font-size: 15px;
		overflow: hidden;
		white-space: nowrap;
	}

	.masked-field .square-button {
		border: 0;
	}

	.status {
		color: #a4a6ae;
		font-size: 17px;
		line-height: 1.6;
		margin: 12px 0 20px;
	}

	.lede {
		color: #a4a6ae;
		font-size: 18px;
		line-height: 1.65;
		margin: 16px 0 22px;
	}

	.actions-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.result {
		margin-top: 20px;
		color: var(--cyan);
		font-size: 16px;
		font-weight: 700;
	}

	.loading {
		color: var(--muted);
		font-size: 17px;
		margin: 24px 0;
		animation: loading-pulse 1.4s ease-in-out infinite;
	}

	@keyframes loading-pulse {
		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0.45;
		}
	}

	:focus-visible {
		outline: 2px solid var(--cyan);
		outline-offset: 3px;
	}

	::selection {
		background: var(--cyan);
		color: #08090d;
	}

	@media (max-width: 760px) {
		.content {
			width: min(100% - 32px, 560px);
			padding-top: 24px;
		}

		.cards {
			grid-template-columns: 1fr;
		}
	}
</style>
