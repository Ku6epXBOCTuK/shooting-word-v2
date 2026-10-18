<script lang="ts">
	import { startChatFlow } from "#lib/chat/flow.js";
	import { startEffectsStream } from "#lib/features/effects/stream.js";
	import { RemoteStorageAdapter } from "#lib/features/persistence/remote-adapter.js";
	import { reportRound } from "#lib/features/rounds/reporter.js";
	import { REWARDS_ENABLED } from "#lib/features/variant.js";
	import { bootstrapGame } from "#lib/game/index.js";
	import type { GameSettings } from "#lib/game/settings.js";
	import type { Application } from "pixi.js";
	import { onMount } from "svelte";
	import CommandTicker from "./CommandTicker.svelte";
	import PixiOverlay from "./PixiOverlay.svelte";

	interface Props {
		channel: string;
		uuid?: string;
		settings?: GameSettings;
		key?: string;
	}

	let { channel, uuid, settings, key }: Props = $props();

	let game: Awaited<ReturnType<typeof bootstrapGame>> | null = null;
	let stopStream: (() => void) | undefined;

	const roundHooks = $derived(
		REWARDS_ENABLED && uuid
			? {
					onRoundEnd: (record: Parameters<typeof reportRound>[1]) =>
						reportRound(uuid as string, record, key),
				}
			: {},
	);

	onMount(() => {
		const stopChat = startChatFlow(() => game, channel);

		return () => {
			stopChat();
			stopStream?.();
			game?.destroy();
			game = null;
		};
	});

	function pixiOverlayReady(app: Application) {
		const transport =
			REWARDS_ENABLED && uuid
				? (id: string, widgetKey?: string) =>
						new RemoteStorageAdapter(id, widgetKey)
				: undefined;

		void bootstrapGame(app, uuid, settings, roundHooks, key, transport).then(
			(instance) => {
				game = instance;
				if (REWARDS_ENABLED && uuid) {
					stopStream = startEffectsStream(instance, uuid, key);
				}
			},
		);
	}
</script>

<PixiOverlay onReady={pixiOverlayReady} />
<CommandTicker />
