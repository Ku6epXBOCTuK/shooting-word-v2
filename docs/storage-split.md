# План: расщепление `/api/storage/[key]` по сущностям

Статус: **черновик на ревью, не выполнено.**

## Зачем

`/api/storage/[key]` — generic-эндпоинт с runtime-диспетчеризацией по
`params.key` для трёх разных сущностей:

- `viewers` — своя таблица `viewers`, merge-семантика upsert;
- `settings`, `rewards` — две строки в одной KV-таблице
  `storage (broadcaster_id, key, data)`.

Сущности уже разделены на уровне типов (`GameSettings` vs `RewardSettings`,
коммит `f1d9036`), но инфраструктура осталась общей: одна таблица, один роут с
if-chain, один клиентский URL-билдер. Конвенция проекта — модуль на сущность
(`broadcasters`, `viewers`, `rounds`, `sessions`, `reward-ids`), каждый со своей
таблицей; `storage` — единственный generic-аномалоид.

Цель: каждая сущность = свой repo-модуль + своя таблица + свой эндпоинт.
Runtime-dispatch исчезает.

## Текущее состояние (факты)

| Сущность | Таблица                  | Эндпоинт                | Клиент                                                       |
| -------- | ------------------------ | ----------------------- | ------------------------------------------------------------ |
| viewers  | `viewers` (уже своя)     | `/api/storage/viewers`  | `ViewerStore` → `HttpStorageAdapter` / `LocalStorageAdapter` |
| settings | `storage` key=`settings` | `/api/storage/settings` | `cabinet/api.ts`, `loadServerSettings`                       |
| rewards  | `storage` key=`rewards`  | `/api/storage/rewards`  | `cabinet/api.ts`, `loadServerRewards`                        |

Общий код: `src/routes/api/storage/[key]/+server.ts` (GET: `resolveBroadcaster`;
PUT: `requireWidgetWriter` + readJson + ветка на ключ),
`src/lib/server/storage/`, `HttpStorageAdapter.url(key)`.

## Целевая архитектура

### Таблицы и модули

1. `src/lib/server/settings/` (`port.ts`, `sqlite-adapter.ts`, `index.ts`) —
   таблица `settings (broadcaster_id TEXT PRIMARY KEY, data TEXT NOT NULL)`.
2. `src/lib/server/reward-settings/` — таблица `reward_settings` аналогично.
3. `src/lib/server/storage/` — **удалить**.
4. `src/lib/server/viewers/` — без изменений (уже отдельный).

### Эндпоинты

| Новый                          | Логика (перенос 1:1 из `storage/[key]`) |
| ------------------------------ | --------------------------------------- |
| `GET/PUT /api/viewers`         | ветка `viewers`                         |
| `GET/PUT /api/settings`        | ветка `settings`                        |
| `GET/PUT /api/reward-settings` | ветка `rewards`                         |
| `/api/storage/[key]`           | удалить                                 |

Auth не меняется: GET — `resolveBroadcaster`, PUT — `requireWidgetWriter`.

### Клиент

- `HttpStorageAdapter.url(key)`: таблица `key → route-id`
  (`viewers → /api/viewers`, `settings → /api/settings`,
  `rewards → /api/reward-settings`) вместо
  `resolve("/api/storage/[key]", { key })`. `StoragePort` и
  `LocalStorageAdapter` не меняются.
- `cabinet/api.ts`: 4 fetch'а → прямые `resolve("/api/settings")` /
  `resolve("/api/reward-settings")`.
- `persistence/index.ts`: без изменений (через адаптер).

### Серверные читатели storage

- `src/routes/api/rewards/+server.ts:31` → repo `reward-settings`.
- `src/lib/server/reward-effects.ts:226, 416` → repo `settings`.

## Миграция данных

Один раз при открытии БД (в `db.ts`, до создания любых репозиториев):

1. `SELECT DISTINCT key FROM storage` — лог-аудит (на проде возможны
   легаси-ключи из старых релизов);
2. в транзакции: `CREATE TABLE IF NOT EXISTS settings / reward_settings`;
   `INSERT OR IGNORE ... SELECT broadcaster_id, data FROM storage WHERE key='settings'`
   (и `key='rewards'`);
3. `DROP TABLE storage`.

Идемпотентно: отсутствие `storage` = уже мигрировано. Прецедент one-time
миграции в проекте: `SqliteViewersRepo.migrate()`.

## Шаги и оценка

| #   | Шаг                                                         | Файлы                                                                                                                                                                                          | Оценка  |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| A   | repo-модули settings / reward-settings + миграция в `db.ts` | `src/lib/server/settings/*`, `src/lib/server/reward-settings/*`, `src/lib/server/db.ts`                                                                                                        | ~55 мин |
| B   | новые эндпоинты, удалить storage-роут                       | `src/routes/api/{settings,reward-settings,viewers}/+server.ts`; удалить `src/routes/api/storage/`                                                                                              | ~30 мин |
| C   | серверные читатели, удалить storage-модуль                  | `api/rewards/+server.ts`, `reward-effects.ts`; удалить `src/lib/server/storage/`                                                                                                               | ~10 мин |
| D   | клиент                                                      | `http-adapter.ts`, `cabinet/api.ts`                                                                                                                                                            | ~20 мин |
| E   | тесты и проверка                                            | обновить `widget-writer.spec.ts` (URL); spec миграции (`:memory:` по образцу `viewers/sqlite-adapter.spec.ts`); `pnpm check` / `test` / `lint`, `build:node`, смоук `dev:node`, `build:static` | ~40 мин |

Итого ≈ 2 ч 35 мин.

## Решения на ревью

1. Имя эндпоинта наград: `/api/reward-settings` (предложено) vs
   `/api/rewards/settings` vs PUT на существующем `/api/rewards` (не рекомендую
   — GET уже занят Twitch-статусом).
2. Shim для старых вкладок: закешированный JS виджета после деплоя получит 404
   на `/api/storage/*` (GET settings уйдёт в дефолты, PUT viewers — ретраи и
   дроп). Варианты: (а) оставить тонкий shim-роут один релиз (~10 строк,
   делегирует в новые хендлеры), (б) принять слом. Рекомендую (а).
3. Легаси-ключи в `storage`: аудит перед дропом, решение по факту.

## Вне рамок

- `autoFulfillment` / `autoRefund` остаются в `GameSettings` — отдельная задача
  бэклога.
- `StoragePort` остаётся абстракцией (static-сборка — localStorage, node —
  HTTP).
- После выполнения закрыть бэклог-пункт «зачем `/storage/[key]`…».

## Проверка (Definition of Done)

- `pnpm check` → 0, `pnpm lint` → 0, `pnpm test` → зелёный;
- `build:node` и `build:static` проходят;
- смоук на `dev:node`: GET/PUT × 3 эндпоинта, миграция на копии БД;
- `src/routes/api/storage/` и `src/lib/server/storage/` отсутствуют в дереве.
