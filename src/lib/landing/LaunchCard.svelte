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
		<div class="card-heading">
			<h2>{title}</h2>
			<p class="card-subtitle">{subtitle}</p>
		</div>
		<div class="card-icon" class:card-icon-pro={variant === "orange"}>
			<Icon as={icon} size="lg" />
		</div>
	</div>
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
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.launch-card:before {
		content: "";
		width: 100%;
		height: 3px;
		background: linear-gradient(
			to right,
			color-mix(in srgb, var(--cyan) 50%, transparent),
			var(--cyan)
		);
		box-shadow: 0 0 12px 1px color-mix(in srgb, var(--cyan) 80%, transparent);
		position: absolute;
		top: 0;
		right: 0;
	}

	.launch-card:after {
		content: "";
		width: 3px;
		height: 100%;
		background: linear-gradient(
			to bottom,
			var(--cyan),
			color-mix(in srgb, var(--cyan) 50%, transparent)
		);
		box-shadow: 0 0 12px 1px color-mix(in srgb, var(--cyan) 80%, transparent);
		position: absolute;
		top: 0;
		right: 0;
	}

	.launch-card-pro:before {
		background: linear-gradient(
			to right,
			color-mix(in srgb, var(--orange) 50%, transparent),
			var(--orange)
		);
		box-shadow: 0 0 12px 1px color-mix(in srgb, var(--orange) 80%, transparent);
	}

	.launch-card-pro:after {
		background: linear-gradient(
			to bottom,
			var(--orange),
			color-mix(in srgb, var(--orange) 50%, transparent)
		);
		box-shadow: 0 0 12px 1px color-mix(in srgb, var(--orange) 80%, transparent);
	}

	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.card-icon {
		width: 52px;
		height: 52px;
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		color: var(--cyan);
		border: 1px solid color-mix(in srgb, var(--cyan) 38%, transparent);
		background: color-mix(in srgb, var(--cyan) 7%, transparent);
	}

	.card-icon-pro {
		color: #ffa27e;
		border-color: rgba(255, 112, 66, 0.6);
		background: rgba(255, 112, 66, 0.12);
		box-shadow: 0 0 14px rgba(255, 112, 66, 0.3);
	}

	.launch-card h2 {
		margin: 0 0 5px;
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
		padding-top: 24px;
	}

	@media (max-width: 760px) {
		.launch-card {
			padding: 22px;
		}
	}
</style>
