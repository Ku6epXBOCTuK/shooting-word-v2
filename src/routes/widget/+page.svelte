<script lang="ts">
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
	import FullVersionStub from "#lib/FullVersionStub.svelte";
	import WidgetPage from "#lib/WidgetPage.svelte";
</script>

{#if REWARDS_ENABLED}
	<WidgetPage />
{:else}
	<FullVersionStub
		title="Виджет для OBS"
		text="Виджет с наградами и сохранениями работает на серверной версии игры — ссылку выдаёт кабинет командира."
	/>
{/if}
