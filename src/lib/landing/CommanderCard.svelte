<script lang="ts">
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
	import GaugeIcon from "~icons/lucide/gauge";
	import RadioIcon from "~icons/lucide/radio";
	import SettingsIcon from "~icons/lucide/settings";
	import ShieldIcon from "~icons/lucide/shield";
	import SparklesIcon from "~icons/lucide/sparkles";
	import LaunchCard from "./LaunchCard.svelte";
	import Button from "./ui/Button.svelte";
	import FeatureItem from "./ui/FeatureItem.svelte";
	import FeatureList from "./ui/FeatureList.svelte";
	import Icon from "./ui/Icon.svelte";
	import ProNote from "./ui/ProNote.svelte";

	const FULL_HOST = "https://xboct-games.duckdns.org";
	const LOGIN_URL = `${FULL_HOST}/auth/twitch/login`;
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
		<Button variant="pro" href={LOGIN_URL}>
			Войти через Twitch
			<Icon as={ArrowUpRightIcon} />
		</Button>
	{/snippet}
</LaunchCard>
