<script lang="ts">
	interface Props {
		value?: string;
		id?: string;
		placeholder?: string;
	}

	let { value = $bindable(""), id, placeholder }: Props = $props();
</script>

<input
	{id}
	bind:value
	{placeholder}
	class="handle-input"
	autocomplete="off"
	spellcheck="false"
/>

<style>
	.handle-input {
		width: 100%;
		background: #0b0d12;
		color: var(--foreground);
		border: 1px solid rgba(255, 255, 255, 0.18);
		padding: 11px 12px;
		font-size: 14px;
		outline: none;
	}

	.handle-input:focus {
		border-color: var(--cyan);
		box-shadow: 0 0 0 2px rgba(105, 216, 230, 0.12);
	}

	.handle-input::placeholder {
		color: #5b5f69;
	}
</style>
