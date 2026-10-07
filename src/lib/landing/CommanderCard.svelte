<script lang="ts">
	import { features } from "#lib/features/variant.js";
	import LaunchCard from "./LaunchCard.svelte";
	import SparklesIcon from "~icons/lucide/sparkles";
	import ShieldIcon from "~icons/lucide/shield";
	import RadioIcon from "~icons/lucide/radio";
	import GaugeIcon from "~icons/lucide/gauge";
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";

	const FULL_HOST = "https://xboct-games.duckdns.org";
</script>

<LaunchCard
	variant="orange"
	title="Командир"
	subtitle="Полный вход через Twitch"
>
	{#snippet icon()}
		<SparklesIcon class="i i-lg" />
	{/snippet}

	{#if features.rewards}
		<ul class="feature-list">
			<li class="feature-item">
				<span class="feature-icon"><ShieldIcon class="i" /></span>
				Награда «Силовой щит» за баллы канала
			</li>
			<li class="feature-item">
				<span class="feature-icon"><RadioIcon class="i" /></span>
				Зрители и их XP хранятся на сервере
			</li>
			<li class="feature-item">
				<span class="feature-icon"><GaugeIcon class="i" /></span>
				Кабинет: ссылка виджета и награды
			</li>
		</ul>
	{/if}

	{#snippet bottom()}
		{#if features.rewards}
			<div class="pro-note">
				<span class="pro-note-mark">TWITCH</span>
				<span
					>разрешения: управление наградами канала, отправка сообщений в чат.</span
				>
			</div>
			<a class="button button-pro" href={FULL_HOST}>
				Войти через Twitch
				<ArrowUpRightIcon class="i" />
			</a>
		{:else}
			<p class="pro-note">в этой сборке недоступна — требует серверный режим</p>
		{/if}
	{/snippet}
</LaunchCard>
