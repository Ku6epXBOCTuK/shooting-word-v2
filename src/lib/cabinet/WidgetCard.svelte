<script lang="ts">
	import LinkIcon from "~icons/lucide/link-2";
	import MonitorPlayIcon from "~icons/lucide/monitor-play";
	import RefreshCwIcon from "~icons/lucide/refresh-cw";
	import LaunchCard from "#lib/landing/LaunchCard.svelte";
	import Button from "#lib/landing/ui/Button.svelte";
	import FieldLabel from "#lib/landing/ui/FieldLabel.svelte";
	import Icon from "#lib/landing/ui/Icon.svelte";
	import { rotateWidgetUuid } from "./api.js";
	import SecretLinkField from "./SecretLinkField.svelte";

	interface Props {
		link: string;
		onrotated: (uuid: string) => void;
	}

	let { link, onrotated }: Props = $props();

	let rotating = $state(false);
	let copied = $state(false);
	let result = $state<string | null>(null);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(link);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 1800);
		} catch {
			result = "не удалось скопировать ссылку";
		}
	};

	const rotate = async () => {
		rotating = true;
		result = null;

		try {
			const uuid = await rotateWidgetUuid();
			if (!uuid) {
				result = "не удалось сбросить ссылку";
				return;
			}
			onrotated(uuid);
			result = "Ссылка виджета обновлена, старая больше не работает";
		} finally {
			rotating = false;
		}
	};
</script>

<LaunchCard
	variant="cyan"
	title="Виджет для OBS"
	subtitle="Browser source для трансляции"
	icon={MonitorPlayIcon}
>
	<FieldLabel>ссылка виджета</FieldLabel>
	<SecretLinkField value={link} />

	{#snippet bottom()}
		<div class="bottom-row">
			<div class="actions-row">
				<Button variant="pro" onclick={copy}>
					<Icon as={LinkIcon} />
					{copied ? "Ссылка скопирована" : "Скопировать ссылку для OBS"}
				</Button>
				<Button variant="pro" disabled={rotating} onclick={rotate}>
					<Icon as={RefreshCwIcon} />
					Сбросить ссылку
				</Button>
			</div>
			{#if result}
				<p class="result">{result}</p>
			{/if}
		</div>
	{/snippet}
</LaunchCard>

<style>
	.bottom-row {
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: flex-start;
	}

	.actions-row {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}

	.result {
		color: var(--cyan);
		font-size: 15px;
		font-weight: 700;
	}
</style>
