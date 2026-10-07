<script lang="ts">
	import { onMount } from "svelte";
	import { resolve } from "$app/paths";
	import PixiOverlay from "#lib/PixiOverlay.svelte";
	import { TwurpleChatAdapter } from "#lib/chat/twurple-adapter.js";
	import type { ChatPort } from "#lib/chat/port.js";
	import { bootstrapGame } from "#lib/game/index.js";
	import { features } from "#lib/features/variant.js";
	import type { ActiveShield } from "#lib/features/rewards/config.js";

	const SHIELDS_POLL_INTERVAL = 10_000;

	let { channel, uuid }: { channel: string; uuid?: string } = $props();

	let game: Awaited<ReturnType<typeof bootstrapGame>> | null = null;

	onMount(() => {
		const chat: ChatPort = new TwurpleChatAdapter();

		chat.onMessage((message) => {
			game?.joinViewer({ userId: message.userId, user: message.user });

			const text = message.text.trim();
			if (text === "!игра") {
				game?.startGame();
				return;
			}
			if (text === "!боты") {
				for (let i = 0; i < 5; i++) {
					const id = Math.random().toString(36).slice(2, 8);
					game?.joinViewer({ userId: `bot-${id}`, user: `бот-${id}` });
				}
				return;
			}
			if (text.startsWith("!скин")) {
				const argument = text.slice("!скин".length).trim();
				const skin = Number.parseInt(argument, 10);
				game?.changeSkin(message.userId, Number.isNaN(skin) ? undefined : skin);
				return;
			}

			game?.shoot(message);
		});
		chat.connect(channel);

		let shieldsTimer: ReturnType<typeof setInterval> | undefined;
		if (features.rewards && uuid) {
			const pollShields = async () => {
				try {
					const response = await fetch(
						`${resolve("/api/shields")}?uuid=${encodeURIComponent(uuid)}`,
					);
					if (!response.ok) return;
					const { shields } = (await response.json()) as {
						shields: ActiveShield[];
					};
					game?.applyShields(shields);
				} catch {
					// endpoint unavailable — retry on next tick
				}
			};

			void pollShields();
			shieldsTimer = setInterval(
				() => void pollShields(),
				SHIELDS_POLL_INTERVAL,
			);
		}

		return () => {
			chat.disconnect();
			if (shieldsTimer) clearInterval(shieldsTimer);
			game?.destroy();
			game = null;
		};
	});
</script>

<PixiOverlay
	onReady={(app) => {
		void bootstrapGame(app, uuid).then((instance) => {
			game = instance;
		});
	}}
/>
