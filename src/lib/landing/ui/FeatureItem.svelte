<script lang="ts">
	import type { Component, Snippet } from "svelte";
	import Icon from "./Icon.svelte";

	interface Props {
		icon: Component<{ class?: string }>;
		children: Snippet;
	}

	let { icon, children }: Props = $props();
</script>

<li class="feature-item">
	<span class="feature-icon"><Icon as={icon} size="md" /></span>
	{@render children()}
</li>

<style>
	.feature-item {
		display: flex;
		align-items: center;
		gap: 10px;
		color: #c7c8cc;
		font-size: 16px;
	}

	.feature-icon {
		width: 32px;
		height: 32px;
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: var(--muted);
	}
</style>
