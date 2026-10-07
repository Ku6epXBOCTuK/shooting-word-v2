<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		variant = "cyan",
		title,
		subtitle,
		icon,
		children,
		bottom,
	}: {
		variant?: "cyan" | "orange";
		title: string;
		subtitle: string;
		icon: Snippet;
		children: Snippet;
		bottom: Snippet;
	} = $props();
</script>

<article class="launch-card" class:launch-card-pro={variant === "orange"}>
	<div class="card-top">
		<div class="card-icon" class:card-icon-pro={variant === "orange"}>
			{@render icon()}
		</div>
	</div>
	<h2>{title}</h2>
	<p class="card-subtitle">{subtitle}</p>
	{@render children()}
	<div class="card-bottom">
		{@render bottom()}
	</div>
</article>
