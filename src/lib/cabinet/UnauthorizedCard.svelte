<script lang="ts">
	import LaunchCard from "#lib/landing/LaunchCard.svelte";
	import Button from "#lib/landing/ui/Button.svelte";
	import { resolve } from "$app/paths";
	import TwitchIcon from "~icons/lucide/twitch";
</script>

<LaunchCard
	variant="orange"
	title="Вход для командира"
	subtitle="Кабинет открывается после авторизации"
	icon={TwitchIcon}
>
	<p class="lede">
		Управление виджетом и наградами канала привязано к твоему Twitch-аккаунту.
	</p>
	{#snippet bottom()}
		<Button variant="pro" href={resolve("/auth/twitch/login")}>
			Войти через Twitch
		</Button>
	{/snippet}
</LaunchCard>

<style>
	.lede {
		color: #a4a6ae;
		font-size: 18px;
		line-height: 1.65;
		margin: 16px 0 22px;
	}
</style>
