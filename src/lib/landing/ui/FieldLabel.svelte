<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		for?: string;
		children: Snippet;
	}

	let { for: htmlFor, children }: Props = $props();
</script>

<label class="field-label" for={htmlFor}>
	{@render children()}
</label>

<style>
	.field-label {
		display: block;
		font-size: 9px;
		letter-spacing: 0.13em;
		color: var(--muted);
		margin: 18px 0 7px;
	}
</style>
