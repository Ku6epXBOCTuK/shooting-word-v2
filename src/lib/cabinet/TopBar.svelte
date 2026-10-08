<script lang="ts">
	import Icon from "#lib/landing/ui/Icon.svelte";
	import { resolve } from "$app/paths";
	import LogOutIcon from "~icons/lucide/log-out";

	interface Props {
		displayName: string | null;
	}

	let { displayName }: Props = $props();
</script>

<header class="topbar">
	<a class="brand" href={resolve("/")}>Shooting Word</a>
	{#if displayName}
		<div class="identity">
			<span class="login-chip">{displayName}</span>
			<a class="logout" href={resolve("/auth/twitch/logout")}>
				<Icon as={LogOutIcon} />
				выйти
			</a>
		</div>
	{/if}
</header>

<style>
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.brand {
		color: var(--foreground);
		text-decoration: none;
		font-weight: 700;
		font-size: 18px;
		letter-spacing: -0.02em;
	}

	.identity {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.login-chip {
		border: 1px solid color-mix(in srgb, var(--cyan) 38%, transparent);
		background: color-mix(in srgb, var(--cyan) 7%, transparent);
		color: var(--cyan);
		padding: 8px 14px;
		font-size: 15px;
		font-weight: 700;
	}

	.logout {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
		text-decoration: none;
		font-size: 15px;
		transition: color 0.2s;
	}

	.logout:hover {
		color: var(--foreground);
	}
</style>
