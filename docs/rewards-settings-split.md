# План: разделение настроек игры и наград

Статус: **WIP, не выполнено.** Это план-документ для ревью. Ниже — разбор
текущих ошибок `pnpm check` (53 шт.) и целевая архитектура.

## Зачем

Сейчас настройки игры (`GameSettings`) и настраиваемые параметры наград
(название, описание, стоимость, кулдаун) лежат в одной сущности. Цель — сделать
их **разными сущностями**, которые сводятся вместе только в одном месте
(адаптер/мерж).

## Диагностика ошибок `pnpm check`

53 ошибки, три корневые причины:

1. **`GameSettings` — сломанный mapped-тип (~40 ошибок).**
   `src/lib/game/settings.ts:80` итерирует `keyof typeof SETTINGS_SCHEMA`, куда
   попадает числовой индекс массива. В value-позиции
   `(typeof SETTINGS_SCHEMA)[I]` даёт объединение всех элементов, поэтому
   `SettingTypeMap[T]` сворачивается в `number | boolean` для каждого ключа.
   Отсюда `settings.viewerScale: number | boolean` во всех системах (`spawn`,
   `core`, `walk`, `measure`, `doomsday-render`, `viewer-render`,
   `portal-render`, `respawn-scheduler`, `enemy-fire`, `word-kill`, `flight`,
   `spawn-enemies`, `round-reset`, `round-log`, `balance/sim`).

2. **`SettingsForm.svelte` — осиротевшая групповая логика (8 ошибок).** После
   выноса наград из `SETTINGS_SCHEMA` пропали `SETTING_GROUPS` и поле `.group`.
   Плюс несоответствие новой сигнатуре `SettingsField`.

3. **`+server.ts` — читает награды из `settings` (5 ошибок).**
   `effectiveRewards(settings)` берёт `settings[\`reward.${key}.title/...\`]`,
   но этих ключей больше нет — это и есть суть разделения.

## Модель синхронизации наград

Ключевое решение: хранить **оверрайды (дельты), а не полные значения**.

- Оверрайд — **по каждому полю отдельно**:
  `Record<rewardKey, Partial<{title, description, cost, cooldown}>>`.
- Эффективное значение = `override ?? default` **поле-в-поле**.
- Дефолты живут в `REWARD_CONFIGS` (в коде, приезжают с релизом игры).
- Изменение дефолта цены увозит на Twitch **только цену**; title/description
  остаются (свой оверрайд или текущий дефолт). Поля независимы — ничего не
  затирается.

Политика синхронизации с Twitch:

- По умолчанию — **push**: следующий `updateReward`/`update-all` перезаписывает
  Twitch эффективными значениями (авто-обновление дефолтов сохраняется).
- Дубля при переименовании не будет: `matchReward` ищет по `storedId` первым.
- Расхождение не теряем молча: на GET сравниваем live-значение Twitch с
  effective и помечаем бейджем «расходится».
- Явное действие **«Забрать из Twitch»** — снапшот live title/description/cost в
  оверрайды ключа (title чистим от префикса `Dev: `). Правки стримера становятся
  «прилипшими».
- **Без авто-импорта** — иначе он заморозил бы дефолт и сломал бы
  авто-обновление.

Что уезжает в rewards-сущность: только `title / description / cost / cooldown`
по каждому ключу награды. Игровые настройки (`batteryMax`, `respawnDuration`,
`viewerScale` и т.п.) остаются в `GameSettings`.

## Шаги реализации

### A. Починить `GameSettings` (~40 ошибок)

`src/lib/game/settings.ts:80`. Заменить mapped-тип на распределение по юниону
элементов:

```ts
type SettingEntry = (typeof SETTINGS_SCHEMA)[number];
export type GameSettings = {
  [Def in SettingEntry as Def["key"]]: Def extends { type: "number" }
    ? number
    : Def extends { type: "boolean" }
      ? boolean
      : string;
};
```

### B. Новая сущность rewards (модуль + storage)

1. Новый файл `src/lib/features/rewards/settings.ts`, куда переезжает
   `REWARDS_SCHEMA` из `settings.ts` (убираем зависимость `settings.ts` от
   reward-конфигов). Там же:
   - `type RewardSettings` (Partial-оверрайды);
   - `defaultRewards()` — из `REWARD_CONFIGS`;
   - `normalizeRewards(raw)` — валидация по `REWARDS_SCHEMA` на каждый ключ;
   - `effectiveRewards(rewards)` — **единственное место мержа**
     `REWARD_CONFIGS` + оверрайдов + `effectiveTitle` (dev-префикс). Переезжает
     из `+server.ts:164`.
2. Storage: добавить ключ `"rewards"` в
   `src/routes/api/storage/[key]/+server.ts` (GET + PUT → `normalizeRewards`).

### C. Клиентский слой загрузки/сохранения rewards

1. `src/lib/cabinet/api.ts`: `loadRewards()` / `saveRewards()` (эндпоинт
   `/api/storage/[key]` с `key:"rewards"`), добавить `rewards` в
   `CabinetSession`.
2. `src/lib/features/persistence/index.ts`: `loadServerRewards(uuid)` по
   аналогии с `loadServerSettings`.

### D. `+server.ts` (5 ошибок)

- `resolveContext` грузит и `settings`, и `rewards`
  (`normalizeRewards(storage.load(...,"rewards"))`).
- `effectiveRewards(context.settings)` → `effectiveRewards(context.rewards)`;
  `context.settings[reward.${key}.title]` → через
  `effectiveRewards(context.rewards)`.

### E. `SettingsField.svelte` — контролируемый компонент

Переделать в managed-компонент: `{def, value, onchange}` вместо `bind:` на prop.

- Инпуты: `value` + `oninput`/`onchange` → `onchange(coerce)` (число через
  `Number`, чекбокс через `checked`, строка как есть).
- `value: SettingValue`.

### F. `SettingsForm.svelte` (8 ошибок)

- Убрать импорт `SETTING_GROUPS` и всю групповую логику (`.group`, `groups`,
  `groupDefs`) — групп больше нет. Оставить `ungrouped` + `devDefs`.
- Передать в `SettingsField` `value={settings[def.key]}` и
  `onchange={(v) => (settings[def.key] = v)}`.

### G. `RewardsEditor.svelte` — реальное редактирование оверрайдов

Сейчас все 4 поля биндятся на одну строку `value` и ничего не сохраняется.

- Поднять `rewardSettings: RewardSettings` (load через `loadRewards`), текущий
  ключ.
- Для каждого поля `REWARDS_SCHEMA`: `value` из оверрайда (или default из
  конфига), `onchange` пишет в `rewardSettings[key][field]`.
- `onSave` в `RewardsCard`: `saveRewards(rewardSettings)` → затем
  `updateReward(key)`. Убрать заглушки `onUpdateAll`/`onSave` с `logger.info`.
- Добавить кнопку «Забрать из Twitch» и бейдж «расходится» (см. модель
  синхронизации).

### H. Проверка

- `pnpm check` → 0.
- `pnpm test`: есть `settings.spec.ts` — добавить кейсы для `normalizeRewards` /
  `effectiveRewards` / мержа `override ?? default`.
- Убрать временный `check.txt`.

## Порядок

1. A — проверка, что остались только D/E/F/G ошибки.
2. B → D — серверная сущность.
3. E → F → G → C — клиент.
4. H — проверка.
