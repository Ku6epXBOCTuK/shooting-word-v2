<script lang="ts">
	import CabinetPage from "#lib/cabinet/CabinetPage.svelte";
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
	import FullVersionStub from "#lib/FullVersionStub.svelte";
</script>

{#if REWARDS_ENABLED}
	<CabinetPage />
{:else}
	<FullVersionStub
		title="Кабинет командира"
		text="Кабинет с виджетом и наградами канала живёт на серверной версии игры — это тот же проект, просто другой домен."
	/>
{/if}
