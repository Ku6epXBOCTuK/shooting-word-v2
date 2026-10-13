<script lang="ts">
	import UpdateToast from "#lib/components/ui/UpdateToast.svelte";
	import { asset } from "$app/paths";
	import "../app.css";
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={asset("favicon.svg")} />
</svelte:head>

{@render children()}

<UpdateToast />
