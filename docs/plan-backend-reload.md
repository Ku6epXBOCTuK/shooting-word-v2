# План: автообновление страницы при обновлении бэкенда

Задача из [backlog.md](./backlog.md) → «Технические задачи».

**Цель**: после деплоя node-варианта OBS-оверлей (и обычные страницы)
подхватывают новый билд без ручного обновления.

## Принятые решения

- Источник версии — `$GITHUB_SHA` (короткий хеш коммита), а не
  `package.json version`: версия бампится cocogitto отдельным коммитом после
  push и по времени не совпадает с деплоем (гонка `bump.yml` vs `deploy.yml`).
- Хеш прокидывается через Docker `build-arg` → Vite `define` как
  `__APP_COMMIT__` (паттерн как у `__APP_VARIANT_NODE__` в `vite.config.ts`).
  `.git` в `.dockerignore`, поэтому `git rev-parse` внутри образа не
  используется.
- Механизм для оверлея — **уже открытый SSE** `/api/effects/stream`
  (`src/routes/api/effects/stream/+server.ts`): постоянный `EventSource`,
  heartbeat каждые 25 сек, первое сообщение — снапшот. Отдельный `/api/version`
  опрос не нужен. Редеплой (`docker compose up -d --force-recreate` в
  `deploy.yml`) рвёт SSE → `EventSource` сам переподключается (~3 сек) → новое
  первое сообщение несёт версию → клиент сравнивает с `__APP_COMMIT__` →
  `location.reload()`.
- Для обычных страниц — штатный `$app/state` → `updated` (тост + кнопка reload).
  Встроенный `updated` для оверлея не используется: OBS Browser Source не
  генерирует события фокуса/видимости и не делает навигаций, дефолтный интервал
  опроса — час.
- Локальная сборка без `APP_COMMIT` получает `"dev"`; приложение в режиме
  `"dev"` перезагрузку по версии не делает.

## Шаги

### 1. Версия на этапе сборки

- [ ] `vite.config.ts`: в `define` добавить
      `__APP_COMMIT__: JSON.stringify(process.env.APP_COMMIT ?? "dev")`.
- [ ] `src/app.d.ts`: объявить `const __APP_COMMIT__: string;` рядом с
      `__APP_VARIANT_NODE__`.
- [ ] `Dockerfile`: в stage `build` — `ARG APP_COMMIT` +
      `ENV APP_COMMIT=$APP_COMMIT` (вшивается в бандл фронта через Vite
      `define`); в финальный stage (`oven/bun`) — те же `ARG`/`ENV` (бэкенд
      читает `process.env.APP_COMMIT` в рантайме).
- [ ] `.github/workflows/deploy.yml`, job `deploy-vps`: шагом раньше вычислить
      короткий хеш (`echo "SHORT_SHA=${GITHUB_SHA::7}" >> $GITHUB_ENV`) и в
      `docker/build-push-action@v6` добавить
      `build-args: APP_COMMIT=${{ env.SHORT_SHA }}`.

### 2. Бэкенд отдаёт версию

- [ ] Новый файл `src/lib/server/version.ts`: экспортировать `SERVER_VERSION` из
      `process.env.APP_COMMIT` (fallback `"dev"`).
- [ ] `src/routes/api/effects/stream/+server.ts`: в функции `encode()` добавлять
      `version: SERVER_VERSION` к payload
      (`{ ...push, version: SERVER_VERSION }`). Первое сообщение
      (`getRewardEffects`) и все последующие пуши идут через `encode()` —
      `src/lib/server/reward-effects.ts` не меняется.

### 3. Клиент (OBS-оверлей) реагирует на смену версии

- [ ] Новый файл `src/lib/features/effects/version.ts`: чистая функция
      `shouldReload(serverVersion: string | undefined, clientVersion: string):     boolean`
      — `true`, если `serverVersion` задан, обе версии не `"dev"` и различаются.
      (Вынос в отдельную функцию — под юнит-тест.)
- [ ] `src/lib/features/effects/stream.ts`:
  - добавить поле `version?: string` в интерфейс `EffectsResponse`;
  - в `onmessage` после `JSON.parse` вызывать
    `shouldReload(response.version, __APP_COMMIT__)`; при `true` —
    `location.reload()` и `return` (не применять устаревший снапшот).

### 4. Обычные страницы: тост «доступна новая версия» (опционально)

- [ ] `src/routes/+layout.svelte`: `import { updated } from "$app/state"` → при
      `updated.current` показывать тост с кнопкой `location.reload()`.
      Тоста/снекбара в проекте нет — свести минимальный UI в layout (или вынести
      в `src/lib` по паттерну проекта), без зависимостей.

### 5. Проверки

- [ ] Юнит-тест `src/lib/features/effects/version.test.ts` на `shouldReload`:
      обе `"dev"` → `false`; сервер `"dev"` → `false`; различаются → `true`;
      равны → `false`; `serverVersion === undefined` → `false`.
- [ ] `pnpm test` (run), `pnpm check`, `pnpm lint`.

## Критерии готовности

- [ ] `APP_COMMIT` попадает в собранный node-бандл фронта (`__APP_COMMIT__`
      заменён, не `undefined`).
- [ ] Контейнер с переданным `APP_COMMIT` отдаёт его в первом SSE-сообщении
      (`version` в `data:`).
- [ ] Смена версии в SSE при открытом оверлее вызывает `location.reload()`.
- [ ] Локальная разработка (`pnpm dev` / `dev:node` без `APP_COMMIT`) не
      вызывает ложных перезагрузок.
- [ ] Все проверки из шага 5 зелёные.

## Ограничения

- Редеплой и так рвёт SSE: оверлей на пару секунд теряет эффекты. Состояние
  viewers/щитов восстанавливается из снапшота; теряется только внутрираундовый
  прогресс врагов на экране (не персистится) — приемлемо.
- static-вариант (GitHub Pages) не имеет бэкенда, шаги 2–3 к нему не применимы.
  Шаг 4 (`updated`) технически работает и на статике (SvelteKit кладёт
  `_app/version.json` и опрашивает его, дефолтный интервал — час), но кэш GitHub
  Pages и отсутствие фокуса/кнопки у OBS Browser Source делают его непригодным
  для авто-обновления оверлея — основной механизм оверлея SSE из шага 3.
