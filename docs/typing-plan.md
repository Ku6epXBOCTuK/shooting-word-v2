# План: типизация наград и поток эффектов

Задачи из [backlog.md](./backlog.md): «слабо затипизированы некоторые вещи с
наградами» и «`requireWidgetWriter` возвращает `Broadcaster | Response`». Плюс
пункты внизу — ревизия канала виджет ↔ сервер ради ошибок в типах на этапе
`svelte-check`, а не в OBS.

## Что нашли

### 1. Названия полей наград живут в четырёх местах

`applyRicochetiums` встречается в `src/lib/game/core.ts:284`,
`src/lib/game/bootstrap.ts:63`, `src/lib/features/effects/stream.ts:36,75`,
`src/lib/game/headless.spec.ts:338,443`.

Главная проблема не название, а то, что `EffectsGame` в `stream.ts` переписан
руками, а не выведен из настоящего типа игры. Переименуешь метод в ядре —
`stream.ts` продолжит компилироваться и сломается в рантайме. Ровно то, что
означает «нигде ошибки не вылезут».

### 2. Типы наград продублированы между сервером и клиентом

`RewardEffect` и `EffectsResponse` в `stream.ts` — копия `RewardEffect` и
`EffectPush` из `src/lib/server/reward-effects.ts`. Копии уже разошлись:
`redemptionId`/`rewardId` обязательные на сервере, опциональные на клиенте;
`rewardTitle` знает только сервер. Связь между копиями компилятор не проверяет.

### 3. `requireWidgetWriter` возвращает `Broadcaster | Response`

Паттерн `if (access instanceof Response) return access;` повторён 4 раза:
`api/rounds`, `api/settings`, `api/viewers`, `api/effects/reject`.

Рядом:

- `widget-writer.ts:34` — `broadcasters.byUuid(uuid) as Broadcaster` глушит
  `null`; `claimWidget` и `byUuid` — два запроса там, где нужен один.
- `api/viewers/+server.ts:44` — `entry as Partial<StoredViewer>`, хотя guard
  `isStoredViewer` уже есть в `viewer-store.ts`.
- `core.ts` — `applyShields` / `applyOvercharges` / `applyRicochetiums` имеют
  три одинаковых тела, различаются компонентом и ключом награды.

### 4. Поток эффектов нельзя проверить типами

`stream.ts` делает `JSON.parse(message.data) as EffectsResponse` — типы на
проводе не проверяются ни на клиенте, ни на сервере.

## Решения

- **Переименование целиком**: метод, wire-поле, тип и все внутренние
  идентификаторы. Слово «рикошетиум» остаётся только в текстах для игроков
  (`title`, `description`, `docs/mechanics.md`, `docs/streamer.md`), чтобы
  UI-название можно было менять свободно, а код всегда говорил `armorCoating`.
  Переименовываются: компонент и тип `Ricochetium`/`ricochetium`
  (`game/types.ts`), system `systems/ricochetium.ts`, `RICOCHETIUM_DURATION_*` →
  `ARMOR_COATING_DURATION_*`, `RICOCHETIUM_REWARD` → `ARMOR_COATING_REWARD`,
  `ActiveRicochetium` → `ActiveArmorCoating`, `RICOCHETIUM_DAMAGE_CHANCE_FACTOR`
  → `ARMOR_COATING_DAMAGE_CHANCE_FACTOR` (`game/config.ts`), vfx
  `COATING_KINDS`/registry (`vfx/kinds.ts`, `vfx/registry.ts`),
  `ViewShip.svelte`, `systems/viewer-render.ts`, серверные переменные, логи и
  имена тестов.
- **Persisted reward key переименовывается с миграцией.** Ключ `"ricochetium"`
  лежит в sqlite `reward_ids (broadcaster_id, key, reward_id)`
  (`server/reward-ids/sqlite-adapter.ts`), по нему ищут `redemptions.ts` и
  `reward-effects.ts`. Без миграции у существующих каналов редимы уходят в
  `key=unknown`. Добавляется `migrations/003_rename_armor_coating_key.js` с
  `UPDATE reward_ids SET key = 'armorCoating' WHERE key = 'ricochetium'`.
- **`requireWidgetWriter` → throw + middleware** в `hooks.server.ts`, не
  discriminated union: роуты должны читаться без ветки на каждую ошибку.
- **Поток эффектов → `query.live`**, не WebSocket. SSE и WS одинаково плохи для
  типов: протокол сообщений пишется руками, компилятор не проверяет, что сервер
  сериализовал то, что клиент распарсил. Типизированный WS — это отдельный
  фреймворк поверх (tRPC) плюс ручная сервер-обёртка вокруг `adapter-node`.
  `query.live` убирает `JSON.parse` на клиенте вообще: тип элемента выводится из
  серверного генератора. Реконнект с backoff идёт от фреймворка.
- **`x-widget-key` переезжает в аргумент** remote function (тело запроса, не
  query param — в access-логи не попадает, конвенция из `widget-writer.ts`
  сохраняется).
- **Стадиями**: этап A не меняет права и не трогает фронтенд-страницы, этап B
  переводит канал. После этапа A ошибки переименования уже ловятся компилятором.

### Про `query.live` и потерю событий

Live-потоки по документации — не event log: если потребитель отстал, не
доставленный yield затирается новым. Поэтому серверный генератор на каждый
`yield` отдаёт **дренаж всей очереди** (`queues` в `reward-effects.ts` уже колит
события), а не одиночное событие, и типизируется как `EffectPush[]`. Отставший
потребитель получает всё при возобновлении. Версионирование сохраняется:
`version` в пуше → `shouldReload` как сейчас.

## Этап A — типизация (~1.5–2 ч)

1. Переименование в коде: `applyRicochetiums` → `applyArmorCoating`, wire
   `ricochetiums` → `armorCoatings`, `ActiveRicochetium` → `ActiveArmorCoating`,
   компонент `ricochetium` → `armorCoating`, system `systems/ricochetium.ts` →
   `systems/armor-coating.ts`, константы `RICOCHETIUM_*` → `ARMOR_COATING_*`,
   vfx coating kind `"ricochetium"` → `"armorCoating"`,
   `ViewShip.svelte`/`viewer-render.ts`, спеки. Reward key `"ricochetium"` →
   `"armorCoating"` в `config.ts` плюс миграция
   `migrations/003_rename_armor_coating_key.js`. Тексты `title`/`description` и
   docs не трогаем. Ссылка в backlog обновляется.
2. Общий контракт в `src/lib/features/rewards/effects.ts`: `RewardEffect`,
   `EffectPush`, `EffectsMessage = EffectPush & { version?: string }`. Сервер и
   клиент импортируют оттуда. `EffectsGame` в `stream.ts` выводится как
   `Pick<Awaited<ReturnType<typeof bootstrapGame>>, ...>` — рассинхрон API
   ловится компилятором.
3. `requireWidgetWriter` бросает `ApiError` со статусом; `hooks.server.ts`
   получает `handle`, который превращает `ApiError` в `Response.json(status)`.
   Роуты: `const broadcaster = requireWidgetWriter(event)`. `claimWidget` в
   порту возвращает broadcaster рядом со статусом клейма — уходит каст
   `as Broadcaster` и лишний `byUuid`. `widget-writer.spec.ts` — под исключения.
4. `api/viewers/+server.ts` — guard `isStoredViewer` вместо каста.
5. `core.ts` — общая фабрика для трёх apply-методов.

## Этап B — remote functions (~3–4 ч, node-вариант)

6. `widget.remote.ts`: `effectsStream = query.live` (генератор поверх
   `subscribeEffects` + `getRewardEffects`, батч-дренаж),
   `rejectEffect = command` (uuid, key, redemptionId, rewardId, reason), viewers
   load/save через `query`/`command`. Аргументы валидируются схемами.
7. `cabinet.remote.ts`: settings, rounds, viewers с авторизацией через
   `getRequestEvent().cookies`; REST-хэндлеры и `resolveBroadcaster` в них
   удаляются.
8. Обвязка retry/timeout для command: ручной per-command, потому что
   blanket-retry на неидемпотентные команды нельзя. Существующий опыт —
   `HttpStorageAdapter::put` (3 попытки, терминальные статусы 401/403/404).
9. `/api/effects/stream` живёт до проверки паритета live-потока, потом сносится.

`StoragePort` получает инъекцию транспорта, чтобы headless-тесты не тянули
SvelteKit-рантайм.

## Ограничения

- Флаг `remoteFunctions` в `vite.config.ts` уже включён, использования нет.
- `adapter-static`: remote functions требуют сервер, на статик-варианте страницы
  с `.remote` не работают. Мигрирует только node-вариант; `check-static-build`
  должен это подтверждать.
- Фича экспериментальная: API может меняться между версиями SvelteKit. Принято
  сознательно.

## Вне скоупа

- WS как транспорт (см. решение выше).
- Изменение механик наград.
