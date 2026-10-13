<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		mark: string;
		children: Snippet;
	}

	let { mark, children }: Props = $props();
</script>

<div class="pro-note">
	<span class="pro-note-mark">{mark}</span>
	<span>
		{@render children()}
	</span>
</div>

<style>
	.pro-note {
		display: flex;
		gap: 12px;
		align-items: center;
		margin: 20px 0 15px;
		padding: 12px;
		border: 1px solid rgba(255, 112, 66, 0.2);
		background: rgba(255, 112, 66, 0.05);
		color: var(--muted);
		font-size: 13px;
		line-height: 1.4;
	}

	.pro-note-mark {
		font-size: 12px;
		color: var(--orange);
		letter-spacing: 0.1em;
	}
</style>
