<script lang="ts">
	import CopyIcon from "~icons/lucide/copy";
	import CheckIcon from "~icons/lucide/check";
	import Icon from "./Icon.svelte";

	interface Props {
		value: string;
	}

	let { value }: Props = $props();

	let copied = $state(false);

	const copy = async () => {
		await navigator.clipboard.writeText(value);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 1800);
	};
</script>

<div class="copy-field">
	<input class="copy-field-input" {value} readonly spellcheck="false" />
	<button
		class="copy-field-button"
		type="button"
		onclick={copy}
		aria-label="Скопировать ссылку"
	>
		<Icon as={copied ? CheckIcon : CopyIcon} />
	</button>
</div>

<style>
	.copy-field {
		display: flex;
		margin-top: 8px;
	}

	.copy-field-input {
		flex: 1;
		min-width: 0;
		background: #0b0d12;
		color: var(--cyan);
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-right: 0;
		padding: 11px 12px;
		font-size: 13px;
		outline: none;
		text-overflow: ellipsis;
	}

	.copy-field-button {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 40px;
		background: #0b0d12;
		color: var(--muted);
		border: 1px solid rgba(255, 255, 255, 0.18);
		cursor: pointer;
		transition:
			color 0.2s,
			border-color 0.2s;
	}

	.copy-field-button:hover {
		color: var(--foreground);
		border-color: rgba(255, 255, 255, 0.3);
	}
</style>
