<script lang="ts">
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
	import CircleOffIcon from "~icons/lucide/circle-off";
	import CrosshairIcon from "~icons/lucide/crosshair";
	import LinkIcon from "~icons/lucide/link-2";
	import RocketIcon from "~icons/lucide/rocket";
	import ShieldIcon from "~icons/lucide/shield";
	import ZapIcon from "~icons/lucide/zap";
	import LaunchCard from "./LaunchCard.svelte";
	import Button from "./ui/Button.svelte";
	import CopyField from "./ui/CopyField.svelte";
	import FeatureItem from "./ui/FeatureItem.svelte";
	import FeatureList from "./ui/FeatureList.svelte";
	import FieldLabel from "./ui/FieldLabel.svelte";
	import HandleInput from "./ui/HandleInput.svelte";
	import Icon from "./ui/Icon.svelte";

	const STATIC_HOST = "https://ku6epxboctuk.is-a.dev/shooting-word-v2";
	const DEFAULT_CHANNEL = "Ku6epXBOCTuK";

	let channel = $state("");
	let copied = $state(false);

	const extractNick = (raw: string): string => {
		const trimmed = raw.trim();
		if (!trimmed) return DEFAULT_CHANNEL;

		const urlMatch = trimmed.match(
			/(?:https?:\/\/)?(?:www\.|m\.)?twitch\.tv\/([a-z0-9_]+)/i,
		);
		if (urlMatch) return urlMatch[1];

		return trimmed.replace(/^@/, "");
	};

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
