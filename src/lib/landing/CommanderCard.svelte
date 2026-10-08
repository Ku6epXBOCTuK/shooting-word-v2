<script lang="ts">
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
	import GaugeIcon from "~icons/lucide/gauge";
	import RadioIcon from "~icons/lucide/radio";
	import SettingsIcon from "~icons/lucide/settings";
	import ShieldIcon from "~icons/lucide/shield";
	import SparklesIcon from "~icons/lucide/sparkles";
	import { resolve } from "$app/paths";
	import { features } from "#lib/features/variant.js";
	import { FULL_HOST } from "./config.js";
	import LaunchCard from "./LaunchCard.svelte";
	import Button from "./ui/Button.svelte";
	import FeatureItem from "./ui/FeatureItem.svelte";
	import FeatureList from "./ui/FeatureList.svelte";
	import Icon from "./ui/Icon.svelte";
	import ProNote from "./ui/ProNote.svelte";

	const loginHref = features.rewards
		? resolve("/auth/twitch/login")
		: resolve("/connect");
	const hostLabel = FULL_HOST.replace("https://", "");
</script>

<LaunchCard
	variant="orange"
	title="Командир"
	subtitle="Полный вход через Twitch"
	icon={SparklesIcon}
>
	<FeatureList>
		<FeatureItem icon={ShieldIcon}>Награды за баллы канала</FeatureItem>
		<FeatureItem icon={RadioIcon}>
			Данные зрителей хранятся на сервере
		</FeatureItem>
		<FeatureItem icon={GaugeIcon}>Уведомления о событиях в чат</FeatureItem>
		<FeatureItem icon={SettingsIcon}>
			Настройки игры в личном кабинете
		</FeatureItem>
	</FeatureList>

	{#snippet bottom()}
		<ProNote mark="TWITCH">
			разрешения: управление наградами канала, отправка сообщений в чат.
		</ProNote>
		<div class="login-row">
			<Button variant="pro" href={loginHref}>
				Войти через Twitch
				<Icon as={ArrowUpRightIcon} />
			</Button>
			{#if !features.rewards}
				<span class="login-hint">вход на {hostLabel}</span>
			{/if}
		</div>
	{/snippet}
</LaunchCard>

<style>
	.login-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.login-hint {
		font-size: 14px;
		font-weight: 700;
		color: var(--muted);
	}
</style>
