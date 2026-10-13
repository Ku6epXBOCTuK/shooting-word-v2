<script lang="ts">
	import FullVersionStub from "#lib/components/game/FullVersionStub.svelte";
	import WidgetPage from "#lib/components/game/WidgetPage.svelte";
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
</script>

{#if REWARDS_ENABLED}
	<WidgetPage />
{:else}
	<FullVersionStub
		title="Виджет для OBS"
		text="Виджет с наградами и сохранениями работает на серверной версии игры — ссылку выдаёт кабинет командира."
	/>
{/if}
