# shooting-word-v2

OBS-оверлей для стрима: слова-враги прилетают на экран, зрители отстреливают их
командами в чате, за убийства начисляется опыт. Зрители отображаются
космическими корабликами внизу экрана.

## Чат-команды

| Команда   | Действие                                  |
| --------- | ----------------------------------------- |
| `<слово>` | выстрел по врагу с таким словом (по всем) |
| `!скин`   | случайный корабль                         |
| `!скин 7` | корабль номер 7 (1–20)                    |

## Варианты сборки

Проект собирается в двух вариантах (`APP_VARIANT`):

| Вариант  | Адаптер        | Фичи                              | Куда         |
| -------- | -------------- | --------------------------------- | ------------ |
| `static` | adapter-static | без наград за баллы канала        | GitHub Pages |
| `node`   | adapter-node   | все фичи + Twitch OAuth + награды | свой сервер  |

Отличия реализованы через порты/адаптеры в `src/lib/features/` — на статике
используются null-адаптеры, типизация в обоих вариантах одинаковая.

## Разработка

```sh
pnpm install
pnpm dev          # static-вариант, http://localhost:5173
pnpm dev:node     # node-вариант, http://localhost:5173
```

## Сборка и запуск

```sh
pnpm build:static   # в ./build (деплоится на GitHub Pages)
pnpm build:node     # в ./build-node
pnpm start          # запуск node-версии, http://localhost:3000
```

## Настройка Twitch (node-вариант)

1. Создай приложение в
   [Twitch Developer Console](https://dev.twitch.tv/console).
2. В **OAuth Redirect URLs** добавь:
   - `http://localhost:5173/auth/twitch/callback` — для разработки
   - `http://localhost:3000/auth/twitch/callback` — для прода
3. Скопируй `.env.example` в `.env` и заполни:
   - `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` — из консоли
   - `TWITCH_BROADCASTER_ID` — числовой id канала
4. Открой `/auth/twitch/login` и подтверди скоуп `channel:read:redemptions`.
5. Токен сохранится в `twitch-token.json` и будет автоматически обновляться —
   повторная авторизация не нужна.

Награды за баллы канала доступны по `GET /api/rewards`.

## OBS

Добавь Browser Source с URL страницы. Фон страницы прозрачный, в браузере
отображается тёмным (`color-scheme: dark`) только для удобства отладки.
