<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<ul class="feature-list">
	{@render children()}
</ul>

<style>
	.feature-list {
		display: grid;
		gap: 12px;
		padding: 20px 0;
		margin: 0;
		list-style: none;
		border-bottom: 1px solid var(--line);
	}
</style>
