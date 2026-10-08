<script lang="ts">
	import { onDestroy, onMount } from "svelte";

	const GLITCH_CYCLE_MS = 10_000;
	const GLITCH_MS = 800;
	const GLITCH_HOLD_MS = 2_000;
	const GLITCH_TYPE_MS = 70;
	const GLITCH_DELETE_MS = 40;

	const HEAD_NORMAL = "Печатать";
	const HEAD_GLITCHED = "Пиздеть в чате";

	let head = $state(HEAD_NORMAL);
	let glitching = $state(false);
	let caret = $state(false);

	const timers: number[] = [];
	const later = (fn: () => void, ms: number) => {
		timers.push(window.setTimeout(fn, ms));
	};

	function deleteChars() {
		const timer = window.setInterval(() => {
			head = head.slice(0, -1);
			if (head.length > 0) return;
			clearInterval(timer);
			typeChars();
		}, GLITCH_DELETE_MS);
		timers.push(timer);
	}

	function typeChars() {
		let i = 0;
		const timer = window.setInterval(() => {
			i++;
			head = HEAD_NORMAL.slice(0, i);
			if (i < HEAD_NORMAL.length) return;
			clearInterval(timer);
			caret = false;
			later(cycle, GLITCH_CYCLE_MS);
		}, GLITCH_TYPE_MS);
		timers.push(timer);
	}

	function cycle() {
		glitching = true;
		later(() => {
			head = HEAD_GLITCHED;
		}, GLITCH_MS / 2);
		later(() => {
			glitching = false;
		}, GLITCH_MS);
		later(() => {
			caret = true;
			deleteChars();
		}, GLITCH_MS + GLITCH_HOLD_MS);
	}

	onMount(() => {
		const reduced = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (reduced) return;
		later(cycle, GLITCH_CYCLE_MS);
	});

	onDestroy(() => {
		for (const timer of timers) {
			clearTimeout(timer);
		}
	});
</script>

<span class="line">
	<span class="sizer" aria-hidden="true">Пиздеть в чате&nbsp;умеют все.</span>
	<span class="content">
		<span class="head" class:glitching data-text={head} aria-hidden="true">
			{head}
		</span>
		{#if caret}<span class="caret" aria-hidden="true"></span>{/if}
		<span aria-hidden="true">&nbsp;умеют все. </span>
	</span>
</span>

<style>
	.line {
		position: relative;
		display: inline-block;
		white-space: nowrap;
	}

	.sizer {
		visibility: hidden;
	}

	.content {
		position: absolute;
		inset: 0 auto auto 0;
		white-space: nowrap;
	}

	.head {
		position: relative;
		display: inline-block;
	}

	.head.glitching {
		animation:
			jitter 0.1s steps(2) infinite,
			tv-flicker 0.2s steps(2) infinite;
		background-image: repeating-linear-gradient(
			0deg,
			rgba(255, 255, 255, 0.08) 0 1px,
			transparent 1px 3px
		);
	}

	.head.glitching::before,
	.head.glitching::after {
		content: attr(data-text);
		position: absolute;
		inset: 0;
	}

	.head.glitching::before {
		color: var(--cyan, #69d8e6);
		animation: slice-a 0.4s steps(3) infinite;
	}

	.head.glitching::after {
		color: var(--lime, #caff42);
		animation: slice-b 0.4s steps(3) infinite;
	}

	.caret {
		display: inline-block;
		width: 0.08em;
		height: 0.9em;
		margin-left: 0.04em;
		background: currentColor;
		vertical-align: -0.08em;
		animation: blink 0.8s steps(1) infinite;
	}

	@keyframes jitter {
		0% {
			transform: translate(0);
		}
		50% {
			transform: translate(-2px, 1px);
		}
		100% {
			transform: translate(2px, -1px);
		}
	}

	@keyframes slice-a {
		0% {
			clip-path: inset(12% 0 62% 0);
			transform: translate(-4px, -2px);
		}
		50% {
			clip-path: inset(52% 0 18% 0);
			transform: translate(4px, 1px);
		}
		100% {
			clip-path: inset(24% 0 44% 0);
			transform: translate(-3px, 2px);
		}
	}

	@keyframes slice-b {
		0% {
			clip-path: inset(58% 0 12% 0);
			transform: translate(4px, 2px);
		}
		50% {
			clip-path: inset(18% 0 55% 0);
			transform: translate(-4px, -1px);
		}
		100% {
			clip-path: inset(40% 0 30% 0);
			transform: translate(3px, -2px);
		}
	}

	@keyframes tv-flicker {
		0% {
			filter: brightness(1.2) contrast(1.4);
		}
		50% {
			filter: brightness(0.7) contrast(0.9);
		}
		100% {
			filter: brightness(1.4) contrast(1.2);
		}
	}

	@keyframes blink {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}
</style>
