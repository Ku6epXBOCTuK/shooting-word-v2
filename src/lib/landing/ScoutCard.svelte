<script lang="ts">
	import LaunchCard from "./LaunchCard.svelte";
	import Button from "./ui/Button.svelte";
	import FeatureList from "./ui/FeatureList.svelte";
	import FeatureItem from "./ui/FeatureItem.svelte";
	import FieldLabel from "./ui/FieldLabel.svelte";
	import HandleInput from "./ui/HandleInput.svelte";
	import Icon from "./ui/Icon.svelte";
	import RocketIcon from "~icons/lucide/rocket";
	import ZapIcon from "~icons/lucide/zap";
	import CrosshairIcon from "~icons/lucide/crosshair";
	import ShieldIcon from "~icons/lucide/shield";
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
	import LinkIcon from "~icons/lucide/link-2";

	const STATIC_HOST = "https://ku6epxboctuk.is-a.dev/shooting-word-v2";
	const DEFAULT_CHANNEL = "Ku6epXBOCTuK";

	let channel = $state("");
	let copied = $state(false);

	const nick = $derived(channel.trim() || DEFAULT_CHANNEL);
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

	const openInBrowser = () => {
		window.open(widgetLink, "_blank", "noopener");
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
	</FeatureList>

	{#snippet bottom()}
		<FieldLabel for="handle">ПОЗЫВНОЙ КАПИТАНА</FieldLabel>
		<HandleInput
			id="handle"
			bind:value={channel}
			placeholder={DEFAULT_CHANNEL}
		/>
		<p class="link-out">{widgetLink}</p>
		<div class="button-row">
			<Button variant="pro" onclick={openInBrowser}>
				Войти в симуляцию
				<Icon as={ArrowUpRightIcon} />
			</Button>
			<Button variant="pro" onclick={copyLink}>
				<Icon as={LinkIcon} />
				{copied ? "Ссылка скопирована" : "Ссылка для OBS"}
			</Button>
		</div>
	{/snippet}
</LaunchCard>

<style>
	.link-out {
		margin: 8px 0 0;
		font-size: 11px;
		word-break: break-all;
		color: var(--cyan);
	}

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
