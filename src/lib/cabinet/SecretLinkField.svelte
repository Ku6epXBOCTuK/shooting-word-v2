<script lang="ts">
	import CopyField from "#lib/landing/ui/CopyField.svelte";
	import Icon from "#lib/landing/ui/Icon.svelte";
	import CheckIcon from "~icons/lucide/check";
	import CopyIcon from "~icons/lucide/copy";
	import EyeIcon from "~icons/lucide/eye";
	import EyeOffIcon from "~icons/lucide/eye-off";

	interface Props {
		value: string;
	}

	let { value }: Props = $props();

	let visible = $state(false);
	let copied = $state(false);

	const copyHidden = async () => {
		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 1800);
		} catch {
			visible = true;
		}
	};
</script>

<div class="link-row">
	<button
		class="square-button"
		type="button"
		title={visible ? "Скрыть" : "Показать"}
		onclick={() => {
			visible = !visible;
		}}
	>
		<Icon as={visible ? EyeOffIcon : EyeIcon} size="md" />
	</button>
	{#if visible}
		<CopyField {value} />
	{:else}
		<div class="masked-field">
			<span class="masked-dots">••••••••••••••••••••••</span>
			<button
				class="square-button"
				type="button"
				aria-label="Скопировать ссылку"
				onclick={copyHidden}
			>
				<Icon as={copied ? CheckIcon : CopyIcon} />
			</button>
		</div>
	{/if}
</div>

<style>
	.link-row {
		display: flex;
		align-items: stretch;
		gap: 8px;
	}

	.link-row :global(.copy-field) {
		flex: 1;
		min-width: 0;
		margin-top: 0;
	}

	.square-button {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 48px;
		background: #0b0d12;
		color: var(--muted);
		border: 1px solid rgba(255, 255, 255, 0.18);
		cursor: pointer;
		transition:
			color 0.2s,
			border-color 0.2s;
	}

	.square-button:hover {
		color: var(--foreground);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.masked-field {
		flex: 1;
		min-width: 0;
		display: flex;
		background: #0b0d12;
		border: 1px solid rgba(255, 255, 255, 0.18);
	}

	.masked-dots {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		padding: 14px;
		color: var(--muted);
		font-size: 15px;
		overflow: hidden;
		white-space: nowrap;
	}

	.masked-field .square-button {
		border: 0;
	}
</style>
