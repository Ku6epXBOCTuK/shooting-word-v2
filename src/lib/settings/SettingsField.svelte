<script lang="ts">
	import type { GameSettings, SettingDef } from "#lib/game/settings.js";
	import FieldLabel from "#lib/landing/ui/FieldLabel.svelte";

	interface Props {
		def: SettingDef;
		settings: GameSettings;
	}

	let { def, settings }: Props = $props();
</script>

<div class="field">
	<FieldLabel>{def.label}</FieldLabel>

	{#if def.type === "number" && def.step !== undefined}
		<div class="number-row">
			<input
				class="range"
				type="range"
				min={def.min}
				max={def.max}
				step={def.step}
				value={Number(settings[def.key])}
				oninput={(event) => {
					settings[def.key] = Number(event.currentTarget.value);
				}}
			/>
			<span class="number-value">{settings[def.key]}</span>
		</div>
	{:else if def.type === "number"}
		<input
			class="text-input"
			type="number"
			min={def.min}
			max={def.max}
			value={Number(settings[def.key])}
			oninput={(event) => {
				settings[def.key] = Number(event.currentTarget.value);
			}}
		/>
	{:else if def.type === "boolean"}
		<input
			class="checkbox"
			type="checkbox"
			checked={Boolean(settings[def.key])}
			onchange={(event) => {
				settings[def.key] = event.currentTarget.checked;
			}}
		/>
	{:else}
		<input
			class="text-input"
			type="text"
			value={String(settings[def.key])}
			maxlength={def.maxLength}
			autocomplete="off"
			spellcheck="false"
			oninput={(event) => {
				settings[def.key] = event.currentTarget.value;
			}}
		/>
	{/if}
</div>

<style>
	.field {
		margin-top: 4px;
	}

	.number-row {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.range {
		flex: 1;
		accent-color: var(--cyan);
		cursor: pointer;
	}

	.number-value {
		min-width: 44px;
		text-align: center;
		border: 1px solid color-mix(in srgb, var(--cyan) 38%, transparent);
		background: color-mix(in srgb, var(--cyan) 7%, transparent);
		color: var(--cyan);
		padding: 6px 10px;
		font-size: 14px;
		font-weight: 700;
	}

	.text-input {
		width: 100%;
		background: #0b0d12;
		color: var(--foreground);
		border: 1px solid rgba(255, 255, 255, 0.18);
		padding: 11px 12px;
		font-size: 14px;
		outline: none;
	}

	.text-input:focus {
		border-color: var(--cyan);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--cyan) 12%, transparent);
	}

	.checkbox {
		width: 20px;
		height: 20px;
		accent-color: var(--cyan);
		cursor: pointer;
	}
</style>
