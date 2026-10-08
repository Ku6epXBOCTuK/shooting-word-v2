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
		position: relative;
		overflow: hidden;
		border: 0;
		padding: 16px 16px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 700;
		text-decoration: none;
		color: var(--foreground);
		background: transparent;
		transition:
			background 0.25s,
			box-shadow 0.25s;
	}

	.button:after {
		content: "";
		position: absolute;
		top: -20%;
		bottom: -20%;
		left: -60%;
		width: 30%;
		background: rgba(255, 255, 255, 0.85);
		mix-blend-mode: screen;
		filter: blur(6px);
		transform: skewX(-20deg);
		pointer-events: none;
	}

	.button:hover:not(:disabled):after {
		left: 130%;
		transition: left 0.4s ease;
	}

	.button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.button-pro {
		background: var(--orange);
		color: #170c08;
		box-shadow: 0 0 16px 2px color-mix(in srgb, var(--orange) 60%, transparent);
	}

	.button-pro:hover:not(:disabled) {
		background: color-mix(in srgb, var(--orange) 88%, white);
		box-shadow: 0 0 30px 4px color-mix(in srgb, var(--orange) 90%, transparent);
	}
</style>
