<script lang="ts">
	import { onMount } from "svelte";
	import { resolve } from "$app/paths";
	import { features } from "#lib/features/variant.js";
	import { rewards } from "#lib/features/rewards/index.js";

	let channel = $state("");
	let rewardsStatus = $state<string | null>(null);
	let authorized = $state(false);

	const gameLink = $derived(
		channel.trim()
			? `${resolve("/game")}?channel=${encodeURIComponent(channel.trim())}`
			: null,
	);

	onMount(async () => {
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

	{#if features.rewards}
		<section>
			<h2>Авторизация Twitch</h2>
			<p>
				<a href={resolve("/auth/twitch/login")}>Войти через Twitch</a>
				{#if authorized}
					· <a href={resolve("/auth/twitch/logout")}>Выйти</a>
				{/if}
			</p>
			{#if rewardsStatus}
				<p class="status">{rewardsStatus}</p>
			{/if}
		</section>
	{:else}
		<section>
			<h2>Настройка оверлея</h2>
			<label>
				Канал:
				<input type="text" bind:value={channel} placeholder="название канала" />
			</label>
			{#if gameLink}
				<p>
					Ссылка для OBS:
					<a href={gameLink}>{gameLink}</a>
				</p>
			{/if}
		</section>
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

	label {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	input {
		flex: 1;
		padding: 0.4rem 0.6rem;
		border: 1px solid #3a3a44;
		border-radius: 6px;
		background: #1c1c22;
		color: inherit;
	}

	a {
		color: #7cb3ff;
		word-break: break-all;
	}

	.status {
		color: #9a9aa5;
		font-size: 0.9rem;
	}
</style>
