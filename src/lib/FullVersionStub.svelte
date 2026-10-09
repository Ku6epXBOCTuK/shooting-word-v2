<script lang="ts">
	import ArrowUpRightIcon from "~icons/lucide/arrow-up-right";
	import { FULL_HOST } from "#lib/landing/config.js";
	import Button from "#lib/landing/ui/Button.svelte";
	import Icon from "#lib/landing/ui/Icon.svelte";

	interface Props {
		title: string;
		text: string;
	}

	let { title, text }: Props = $props();
</script>

<div class="scene">
	<main class="stub">
		<h1>{title}</h1>
		<p class="lede">{text}</p>
		<Button variant="pro" href={FULL_HOST}>
			Открыть полную версию
			<Icon as={ArrowUpRightIcon} />
		</Button>
	</main>
</div>

<style>
	.scene {
		--background: #08090d;
		--foreground: #ecebe7;
		--muted: #8b8e98;
		--cyan: #69d8e6;
		--orange: #ff7042;
		position: fixed;
		inset: 0;
		overflow-y: auto;
		background: var(--background);
		color: var(--foreground);
		font-family: Arial, Helvetica, sans-serif;
	}

	.stub {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		padding: 24px;
		text-align: center;
	}

	h1 {
		font-size: clamp(28px, 4vw, 42px);
		letter-spacing: -0.03em;
		margin: 0;
	}

	.lede {
		max-width: 520px;
		color: #a4a6ae;
		font-size: 16px;
		line-height: 1.65;
		margin: 0;
	}
</style>
