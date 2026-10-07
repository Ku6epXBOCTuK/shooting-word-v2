<script lang="ts">
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
	import GaugeIcon from "~icons/lucide/gauge";
	import RadioIcon from "~icons/lucide/radio";
	import ShieldIcon from "~icons/lucide/shield";
	import SparklesIcon from "~icons/lucide/sparkles";
	import LaunchCard from "./LaunchCard.svelte";
	import Button from "./ui/Button.svelte";
	import FeatureList from "./ui/FeatureList.svelte";
	import FeatureItem from "./ui/FeatureItem.svelte";
	import Icon from "./ui/Icon.svelte";
	import ProNote from "./ui/ProNote.svelte";

	const FULL_HOST = "https://xboct-games.duckdns.org";
</script>

<LaunchCard
	variant="orange"
	title="Командир"
	subtitle="Полный вход через Twitch"
	icon={SparklesIcon}
>
	<FeatureList>
		<FeatureItem icon={ShieldIcon}>
			Награда «Силовой щит» за баллы канала
		</FeatureItem>
		<FeatureItem icon={RadioIcon}>
			Зрители и их XP хранятся на сервере
		</FeatureItem>
		<FeatureItem icon={GaugeIcon}>
			Кабинет: ссылка виджета и награды
		</FeatureItem>
	</FeatureList>

	{#snippet bottom()}
		<ProNote mark="TWITCH">
			разрешения: управление наградами канала, отправка сообщений в чат.
		</ProNote>
		<Button variant="pro" href={FULL_HOST}>
			Войти через Twitch
			<Icon as={ArrowUpRightIcon} />
		</Button>
	{/snippet}
</LaunchCard>
