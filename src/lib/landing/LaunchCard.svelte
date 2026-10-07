<script lang="ts">
	import type { Component, Snippet } from "svelte";
	import Icon from "./ui/Icon.svelte";

	interface Props {
		variant?: "cyan" | "orange";
		title: string;
		subtitle: string;
		icon: Component<{ class?: string }>;
		children: Snippet;
		bottom: Snippet;
	}

	let {
		variant = "cyan",
		title,
		subtitle,
		icon,
		children,
		bottom,
	}: Props = $props();
</script>

<article class="launch-card" class:launch-card-pro={variant === "orange"}>
	<div class="card-top">
		<div class="card-icon" class:card-icon-pro={variant === "orange"}>
			<Icon as={icon} size="lg" />
		</div>
	</div>
	<h2>{title}</h2>
	<p class="card-subtitle">{subtitle}</p>
	{@render children()}
	<div class="card-bottom">
		{@render bottom()}
	</div>
</article>

<style>
	.launch-card {
		border: 1px solid rgba(255, 255, 255, 0.42);
		background: var(--panel);
		padding: 27px;
		min-height: 355px;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.launch-card:before {
		content: "";
		width: 44px;
		height: 2px;
		background: var(--cyan);
		position: absolute;
		top: -1px;
		left: 26px;
	}

	.launch-card-pro:before {
		background: var(--orange);
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-icon {
		width: 38px;
		height: 38px;
		display: grid;
		place-items: center;
		color: var(--cyan);
		border: 1px solid rgba(105, 216, 230, 0.38);
		background: rgba(105, 216, 230, 0.07);
	}

	.card-icon-pro {
		color: var(--orange);
		border-color: rgba(255, 112, 66, 0.4);
		background: rgba(255, 112, 66, 0.07);
	}

	.launch-card h2 {
		margin: 24px 0 5px;
		font-size: 28px;
		letter-spacing: -0.03em;
	}

	.card-subtitle {
		margin: 0;
		color: var(--muted);
		font-size: 16px;
	}

	.card-bottom {
		margin-top: auto;
	}

	@media (max-width: 760px) {
		.launch-card {
			padding: 22px;
		}
	}
</style>
