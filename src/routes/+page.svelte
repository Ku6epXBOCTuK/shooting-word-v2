<script lang="ts">
	import { resolve } from "$app/paths";
	import { features } from "#lib/features/variant.js";

	let channel = $state("");

	const gameLink = $derived(
		channel.trim()
			? `${resolve("/game")}?channel=${encodeURIComponent(channel.trim())}`
			: null,
	);
</script>

<main>
	<h1>shooting-word</h1>

	{#if features.rewards}
		<section>
			<h2>Авторизация Twitch</h2>
			<p>
				<a href={resolve("/auth/twitch/login")}>Войти через Twitch</a>
			</p>
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
</style>
