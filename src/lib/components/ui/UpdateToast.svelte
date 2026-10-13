<script lang="ts">
	import Button from "#lib/components/ui/Button.svelte";
	import { page, updated } from "$app/state";

	const OVERLAY_ROUTES = new Set(["/widget", "/game"]);

	const visible = $derived(
		updated.current && !OVERLAY_ROUTES.has(page.route.id ?? ""),
	);
</script>

{#if visible}
	<div class="toast" role="status">
		<span class="text">Доступна новая версия</span>
		<Button onclick={() => location.reload()}>Обновить</Button>
	</div>
{/if}

<style>
	.toast {
		--foreground: #ecebe7;
		--orange: #ff7042;
		position: fixed;
		z-index: 100;
		right: 16px;
		top: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		background: #11131adb;
		border: 1px solid #ffffff3d;
		font-family: Arial, Helvetica, sans-serif;
	}

	.text {
		color: #8b8e98;
		font-size: 14px;
	}

	.toast :global(.button) {
		border: 1px solid #ffffff2e;
		padding: 8px 12px;
		font-size: 14px;
		color: black;
		background-color: var(--orange);
	}
</style>
