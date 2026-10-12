<script lang="ts">
	import "../app.css";
	import favicon from "#lib/assets/favicon.svg";
	import UpdateToast from "#lib/UpdateToast.svelte";
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<UpdateToast />
