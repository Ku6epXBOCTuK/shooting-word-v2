<script lang="ts">
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
	import { FULL_HOST, TWITCH_LOGIN_URL } from "#lib/landing/config.js";
	import Button from "#lib/landing/ui/Button.svelte";
	import Icon from "#lib/landing/ui/Icon.svelte";
</script>

<svelte:head>
	<title>Вход для командира — Shooting Word</title>
</svelte:head>

<div class="scene">
	<main class="connect">
		<h1>Полная версия — на другом сайте</h1>
		<p class="lede">
			Этот сайт — лёгкая версия игры без сервера: здесь нет наград и сохранений.
			Полная версия живёт на нашем сервере — это тот же проект, просто другой
			домен:
		</p>
		<code class="host">{FULL_HOST.replace("https://", "")}</code>
		<p class="lede">Там тебя встретит стандартный вход через Twitch.</p>
		<Button variant="pro" href={TWITCH_LOGIN_URL}>
			Войти через Twitch
			<Icon as={ArrowUpRightIcon} />
		</Button>
	</main>
</div>

<style>
	.scene {
		--background: #08090d;
		--foreground: #ecebe7;
		--muted: #8b8e98;
		--orange: #ff7042;

		position: fixed;
		inset: 0;
		overflow-y: auto;
		background: var(--background);
		color: var(--foreground);
		font-family: Arial, Helvetica, sans-serif;
	}

	.connect {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		padding: 24px;
		text-align: center;
	}

	.connect h1 {
		font-size: clamp(28px, 4vw, 42px);
		letter-spacing: -0.03em;
		margin: 0;
	}

	.lede {
		max-width: 520px;
		color: #a4a6ae;
		font-size: 16px;
		line-height: 1.65;
		margin: 0;
	}

	.host {
		font-size: 15px;
		color: var(--foreground);
		border: 1px solid rgba(255, 255, 255, 0.24);
		background: rgba(17, 19, 26, 0.86);
		padding: 8px 14px;
	}
</style>
