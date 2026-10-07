<script lang="ts">
	import LaunchCard from "./LaunchCard.svelte";
	import RocketIcon from "~icons/lucide/rocket";
	import ZapIcon from "~icons/lucide/zap";
	import CrosshairIcon from "~icons/lucide/crosshair";
	import ShieldIcon from "~icons/lucide/shield";
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
	import LinkIcon from "~icons/lucide/link-2";

	const STATIC_HOST = "https://ku6epxboctuk.is-a.dev/shooting-word-v2";

	let channel = $state("");
	let copied = $state(false);

	const nick = $derived(channel.trim());
	const widgetLink = $derived(
		nick ? `${STATIC_HOST}/game?channel=${encodeURIComponent(nick)}` : null,
	);

	const copyLink = async () => {
		if (!widgetLink) return;
		await navigator.clipboard.writeText(widgetLink);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1800);
	};

	const openInBrowser = () => {
		if (widgetLink) window.open(widgetLink, "_blank", "noopener");
	};
</script>

<LaunchCard title="Разведчик" subtitle="Без авторизации и разрешений">
	{#snippet icon()}
		<RocketIcon class="i i-lg" />
	{/snippet}

	<ul class="feature-list">
		<li class="feature-item">
			<span class="feature-icon"><ZapIcon class="i" /></span>
			Полный игровой цикл без входа
		</li>
		<li class="feature-item">
			<span class="feature-icon"><CrosshairIcon class="i" /></span>
			Слова, стрельба и волны
		</li>
		<li class="feature-item">
			<span class="feature-icon"><ShieldIcon class="i" /></span>
			Прогресс сохраняется локально
		</li>
	</ul>

	{#snippet bottom()}
		<label class="field-label" for="handle">ПОЗЫВНОЙ КАПИТАНА</label>
		<input
			id="handle"
			bind:value={channel}
			placeholder="например, nova_7"
			class="handle-input"
			autocomplete="off"
			spellcheck="false"
		/>
		{#if widgetLink}
			<p class="link-out">{widgetLink}</p>
		{/if}
		<div class="button-row">
			<button
				class="button button-primary"
				type="button"
				disabled={!widgetLink}
				onclick={openInBrowser}
			>
				Войти в симуляцию
				<ArrowUpRightIcon class="i" />
			</button>
			<button
				class="button button-ghost"
				type="button"
				disabled={!widgetLink}
				onclick={copyLink}
			>
				<LinkIcon class="i" />
				{copied ? "Ссылка скопирована" : "Ссылка для OBS"}
			</button>
		</div>
	{/snippet}
</LaunchCard>
