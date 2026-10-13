<script lang="ts">
	import type { Snippet } from "svelte";
	import { resolve } from "$app/paths";

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<header class="topbar">
	<a class="brand" href={resolve("/")}>Shooting Word</a>
	{#if children}
		<div class="side">
			{@render children()}
		</div>
	{/if}
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.brand {
		color: var(--foreground);
		text-decoration: none;
		font-weight: 700;
		font-size: 18px;
		letter-spacing: -0.02em;
	}

	.side {
		display: flex;
		align-items: center;
		gap: 14px;
	}
</style>
