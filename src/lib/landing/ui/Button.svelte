<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		variant?: "default" | "pro";
		href?: string;
		onclick?: () => void;
		disabled?: boolean;
		children: Snippet;
	}

	let {
		variant = "default",
		href,
		onclick,
		disabled = false,
		children,
	}: Props = $props();
</script>

{#if href}
	<a class="button" class:button-pro={variant === "pro"} {href}>
		{@render children()}
	</a>
{:else}
	<button
		class="button"
		class:button-pro={variant === "pro"}
		type="button"
		{onclick}
		{disabled}
	>
		{@render children()}
	</button>
{/if}

<style>
	.button {
		border: 0;
		padding: 11px 13px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 13px;
		font-weight: 700;
		text-decoration: none;
		color: var(--foreground);
		background: transparent;
		transition:
			transform 0.2s,
			background 0.2s;
	}

	.button:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.button-pro {
		background: var(--orange);
		color: #170c08;
	}
</style>
