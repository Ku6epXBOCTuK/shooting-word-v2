import type { ConsumableField } from "#lib/features/persistence/viewer-store.js";
import type {
	ActiveArmorCoating,
	ActiveOvercharge,
	ActiveShield,
} from "./config.js";

export interface RewardEffect {
	key: string | null;
	userId: string;
	userName: string;
	rewardTitle: string;
	redemptionId: string;
	rewardId: string;
	counts?: Partial<Record<ConsumableField, number>>;
}

export interface EffectPush {
	shields: ActiveShield[];
	overcharges: ActiveOvercharge[];
	armorCoatings: ActiveArmorCoating[];
	effects: RewardEffect[];
}

export type EffectsMessage = EffectPush & { version?: string };
