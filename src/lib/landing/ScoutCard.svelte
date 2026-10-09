<script lang="ts">
	import { resolve } from "$app/paths";
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
	import CircleOffIcon from "~icons/lucide/circle-off";
	import CrosshairIcon from "~icons/lucide/crosshair";
	import LinkIcon from "~icons/lucide/link-2";
	import RocketIcon from "~icons/lucide/rocket";
	import SettingsIcon from "~icons/lucide/settings";
	import ShieldIcon from "~icons/lucide/shield";
	import ZapIcon from "~icons/lucide/zap";
	import LaunchCard from "./LaunchCard.svelte";
	import { DEFAULT_CHANNEL, extractNick } from "./handle.js";
	import Button from "./ui/Button.svelte";
	import CopyField from "./ui/CopyField.svelte";
	import FeatureItem from "./ui/FeatureItem.svelte";
	import FeatureList from "./ui/FeatureList.svelte";
	import FieldLabel from "./ui/FieldLabel.svelte";
	import HandleInput from "./ui/HandleInput.svelte";
	import Icon from "./ui/Icon.svelte";

	const STATIC_HOST = "https://ku6epxboctuk.is-a.dev/shooting-word-v2";

	let channel = $state("");
	let copied = $state(false);

	const nick = $derived(extractNick(channel));
	const widgetLink = $derived(
		`${STATIC_HOST}/game?channel=${encodeURIComponent(nick)}`,
	);

	const copyLink = async () => {
		await navigator.clipboard.writeText(widgetLink);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1800);
	};
</script>

<LaunchCard
	title="Разведчик"
	subtitle="Без авторизации и разрешений"
	icon={RocketIcon}
>
	<FeatureList>
		<FeatureItem icon={ZapIcon}>Полный игровой цикл без входа</FeatureItem>
		<FeatureItem icon={CrosshairIcon}>Слова, стрельба и волны</FeatureItem>
		<FeatureItem icon={ShieldIcon}>Прогресс сохраняется локально</FeatureItem>
		<FeatureItem icon={CircleOffIcon}>
			Без наград Twitch и данных на сервере
		</FeatureItem>
	</FeatureList>

	{#snippet bottom()}
		<FieldLabel for="handle">ПОЗЫВНОЙ КАПИТАНА</FieldLabel>
		<HandleInput
			id="handle"
			bind:value={channel}
			placeholder={DEFAULT_CHANNEL}
		/>
		<CopyField value={widgetLink} />
		<div class="button-row">
			<Button variant="pro" href={widgetLink} target="_blank">
				Войти в симуляцию
				<Icon as={ArrowUpRightIcon} />
			</Button>
			<Button variant="pro" onclick={copyLink}>
				<Icon as={LinkIcon} />
				{copied ? "Ссылка скопирована" : "Ссылка для OBS"}
			</Button>
			<Button variant="pro" href={resolve("/settings")}>
				<Icon as={SettingsIcon} />
				Настройки
			</Button>
		</div>
	{/snippet}
</LaunchCard>

<style>
	.button-row {
		display: flex;
		gap: 9px;
		margin-top: 13px;
	}

	@media (max-width: 760px) {
		.button-row {
			flex-wrap: wrap;
		}
	}
</style>
