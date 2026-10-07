<script lang="ts">
	import type { Component } from "svelte";

	interface Props {
		as: Component<{ class?: string }>;
		size?: "sm" | "lg";
	}

	let { as: Cmp, size = "sm" }: Props = $props();
</script>

<Cmp class="icon icon-{size}" />

<style>
	:global(.icon) {
		width: 14px;
		height: 14px;
		flex: 0 0 auto;
	}

	:global(.icon-lg) {
		width: 20px;
		height: 20px;
	}
</style>
