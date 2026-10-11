export interface RewardConfig {
	key: string;
	title: string;
	description: string;
	cost: number;
	cooldown: number;
}

export const SHIELD_REWARD: RewardConfig = {
	key: "shield",
	title: "Силовой щит",
	description:
		"Щит на 10 минут: 3 заряда с восстановлением каждого заряда за 20 секунд",
	cost: 300,
	cooldown: 0,
};

export const BATTERY_REWARD: RewardConfig = {
	key: "battery",
	title: "Энергоячейка для ремонта",
	description:
		"+1 Энергоячейка для ремонта (максимум 5). Потратить: !repair — +3 hp себе, !repair @ник — +3 hp другому игроку",
	cost: 200,
	cooldown: 0,
};

export const REVIVE_REWARD: RewardConfig = {
	key: "revive",
	title: "Аварийный маяк",
	description:
		"Маяк возврата в игру (максимум 1). При разрушении корабля во время раунда: ты возвращаешься с полным hp",
	cost: 400,
	cooldown: 0,
};

export const BEACON_REWARD: RewardConfig = {
	key: "beacon",
	title: "Циномаяк",
	description:
		"Маяк возврата другого игрока (максимум 1). Потратить: !маяк @ник — игрок возвращается с полным hp",
	cost: 400,
	cooldown: 0,
};

export const DOOMSDAY_REWARD: RewardConfig = {
	key: "doomsday",
	title: "Doomsday device",
	description: "При активации в течении 25 секунд уничтожает всех врагов",
	cost: 2000,
	cooldown: 0,
};

export const TIME_STOP_REWARD: RewardConfig = {
	key: "timestop",
	title: "Остановка времени",
	description: "Замораживает врагов на 10 секунд",
	cost: 500,
	cooldown: 0,
};

export const OVERCHARGE_REWARD: RewardConfig = {
	key: "overcharge",
	title: "Перегрузка оружия",
	description:
		"2 минуты корабль стреляет по всем слова из сообщения, а не только по первому",
	cost: 600,
	cooldown: 0,
};

export const RICOCHETIUM_REWARD: RewardConfig = {
	key: "ricochetium",
	title: "Обмазка из рикошетиума",
	description:
		"5 минут вражеские снаряды вдвое реже наносят урон твоему кораблю",
	cost: 400,
	cooldown: 0,
};

export const REWARD_CONFIGS: RewardConfig[] = [
	SHIELD_REWARD,
	BATTERY_REWARD,
	REVIVE_REWARD,
	BEACON_REWARD,
	DOOMSDAY_REWARD,
	TIME_STOP_REWARD,
	OVERCHARGE_REWARD,
	RICOCHETIUM_REWARD,
];

export const SHIELD_DURATION_MS = 10 * 60 * 1000;
export const OVERCHARGE_DURATION_MS = 2 * 60 * 1000;
export const RICOCHETIUM_DURATION_MS = 5 * 60 * 1000;

export interface ActiveShield {
	userId: string;
	userName: string;
	expiresAt: number;
}

export type ActiveOvercharge = ActiveShield;
export type ActiveRicochetium = ActiveShield;
