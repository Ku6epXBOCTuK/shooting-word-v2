# Backlog

## Баланс

- [ ] в ECS нет давления - сим на реальных системах (окт 2026, docs/balance.md)
      показывает вайпа нет даже при p=1: спавн 2-4 сек фикс, кап MAX_ENEMIES 30,
      чат успевает всё (5 активных ~= 1 слово/сек против спавна 0.33/сек).
      Старое окно вайпа в отдельной симуляции достигалось спавном с масштабом от
      активных (spawnScaleK=1: интервал делился на 1+активные). Записка
      "дроссель 190/total^1.5" относилась к старой симе - в коде игры её нет.
      activeSpawnInterval/activeMaxEnemies в config.ts существуют, но не
      подключены и слабые (масштаб от total, а не от активных). Нужно: механика
      давления в PLAYING (спавн от числа активных и/или кап по ним), потом
      рекалибровка CALIBRATE=1
- [ ] докрутить бафф-множитель по живой статистике (docs/balance.md показывает
      ×2, цель ×3-4): частота редимов батарей, стоимость, порог использования.
      Дроссель утечки внедрён (enemy-fire, fireInterval = 190/total^1.5),
      no-buff окно 5-10 мин достигнуто на 10/30/50. Открытый вопрос: max_enemies
      и очередь красных слов на экране (плотность ~100-110 слов на 1080p)
- [ ] батареи (финально - когда все баффы будут готовы): разделить эффект - на
      себя меньше hp (предположение +2), на другого больше (предположение +5).
      Сейчас единые +3 (BATTERY_HEAL), ремонт другого через !repair @user

## Геймплей\Фичи\Идеи

- [ ] при начале игры - сбрасывается щит, даже если был куплен за минуту до
      начала
- [ ] как работает щит? рикошеты учитываются или нет?
- [ ] цикл разрушения корабля зрителя: взрыв - портал, слишком быстрый. нужен
      более длительный взрыв, паузу между взрывом и появлением портала и
      анимацию появления портала из точки
- [ ] анимация межраундового перерыва в афк-режиме (30 сек между gameover и
      автостартом, фаза intermission): сейчас враги не спавнятся и экран
      статичен - нужен визуал паузы (таймер обратного отсчета, надпись и т.п.)
- [ ] слова приближаются слишком равномерно\скучно, посмотреть
      скорости\ускорения и возможно какую-то анимацию тряски\удара при остановке
- [ ] перерисовать щит\
      ![shield bubble](./images/shield-bubble.avif)
- [ ] пересмотреть ui\ux страниц настроек - сохранение при редактировании,
      индикатор изменений и т.д.
- [ ] типы врагов и типы снарядов: враги цветных типов (fx 4х цветов уже есть),
      убить врага может только снаряд того же цвета
- [ ] перезарядка (смена типа снаряда): по команде чата или через награду,
      должна занимать время - тогда есть смысл распределять цвета по чату
      (кто-то стреляет одним типом, кто-то другим)
- [ ] мощные снаряды за баллы канала (например пачка по 100): убивают врага
      любого типа без перезарядки
- [ ] airstrike за баллы: взрывает все слова на экране (дорого, кулдаун ~5 мин)
- [ ] emp / time stop за баллы: замораживает ttl слов на 10 сек - передышка для
      чата
- [ ] overcharge за баллы: 15 сек твои выстрелы убивают слово по подстроке
      (первые 3 буквы) - бафф активного игрока
- [ ] расходник "циномаяк": позволяет поставить маяк для оживления ДРУГОГО
      игрока (удаленное возрождение - парно к аварийному маяку, который
      воскрешает владельца)
- [ ] обдумать динамический шанс урона: авто-подгонка p при сильном отступлении
      от графика (вайп слишком быстрый\медленный против целевого окна)
- [ ] бафф "обмазка из рикошетиума": снижает шанс попадания p по конкретному
      игроку
- [ ] абилка босса: временно увеличивает шанс попадания p по игрокам
- [ ] подумать над дружественными словами - по темам или цветам выбирать

## Технические задачи

- [ ] писать в чат от имени бот-аккаунта (отдельный токен бота, не основного
      стримера)
- [ ] пересмотреть favicon, что я там вообще хочу?

## Roadmap

- [ ] оценить варианты масштабирования eventsub при росте числа стримеров:
      conduit с шардированием (ws), http-webhook транспорт, irc для чат-команд.
      Текущий ws-листенер на стримера ок до десятков
- [ ] обдумать переезд бекенда на rust + axum (vps слабая, нужна минимальная
      нагрузка) - отдельная эпопея после bun (вроде на bun не большой бюджет на
      память, можно оставить, но исследовать позже)
- [ ] entity id для сущностей. Исследовано (окт 2026): сейчас не нужно - ссылки
      между сущностями (homing.target) закрыты guard'ом world.has(), miniplex не
      переиспользует объекты, сериализации ссылок нет. Может понадобиться, если
      появится: - сетевой режим (ссылки надо передавать по сети) - сейв/загрузка
      состояния мира посреди игры (сериализация ссылок между сущностями) -
      быстрый поиск сущности по ключу при большом количестве сущностей (сейчас
      lookup'ы итерацией по крошечным запросам, O(n) несущественен) Цена
      внедрения: miniplex не индексирует по id - нужна своя Map<id, entity>,
      синхронизированная с add/remove.

## Архив

## План: симуляция баланса на ECS (headless)

Оценка: 10-14 ч. Сейчас sim.ts - отдельный движок, расходится с игрой (спавн,
огонь, смерть, TTL, баффы). Переводим симуляцию на реальные логические системы
без pixi. Калибруем ТОЛЬКО режим `!игра` (playing, перманентная смерть); афк и
другие режимы - отдельно потом.

Дизайн: никаких моков - pixi уходит из логики в 3 точках: ctx.app -> screen:
Size (логике нужны только размеры), measure читает спрайт -> measureText(text):
Size в контексте (в игре - pixi Text, в sim - estimateWordSize из spawn.ts;
размер зрителя = константы x viewerScale), explosion.ts берёт кадры из
assets.explosion.length -> константа в config.ts. Для детерминизма Math.random/
Date.now (walk, spawn-enemies, placement, enemy-fire, spawn, shield,
enemy-attack) уходят в ctx.rng()/ctx.now() с настоящими дефолтами; sim
подсовывает seeded mulberry32 + виртуальные часы.

- [x] 1. разделить контекст: GameContext = { world, screen: Size, settings,
      viewerStore, viewersDirty, now(), rng() }; app/assets уходят в
      RenderContext поверх него; поправлены flight, perspective, spawn-enemies,
      walk, respawn-scheduler, spawn, bootstrap; systemGroups разделены на
      logicGroups/renderGroups/cleanupGroups (порядок render перед cleanup
      сохранён); render-системы на RenderSystemFactory; кадры взрыва -
      EXPLOSION_FRAME_LABELS в config.ts (assets.ts и explosion.ts читают
      оттуда)
- [x] 2. measureText в контексте: measure.ts не читает sprite - size зрителя из
      констант корабля + measureText(ник, VIEWER_LABEL_FONT_SIZE), кэш по (user,
      scale) в WeakMap, перевычисление при смене ника/масштаба; игровая
      реализация - pixi Text probe в bootstrap (кэш TextStyle), headless -
      estimateWordSize (добавлен параметр fontSize). Бонус: size больше не
      отстаёт на кадр после спавна
- [x] 3. rng()/now() по системам: walk, spawn-enemies, placement, enemy-fire,
      spawn, respawn-scheduler, enemy-shot-hit (Math.random -> ctx.rng, у
      randomWord/findPlacement/spawnEnemy rng - явный параметр); shield,
      enemy-attack, enemy-fire, viewer-timeout (Date.now -> ctx.now);
      bootstrap - skin/lastSeen/restoreViewers/changeSkin через ctx
- [x] 4. headless-раннер: ядро игры вынесено в core.ts (createGameCore: world +
      ctx + группы + step(dt) + весь api bootstrap); render-группы -
      опциональный параметр (без них pixi не импортируется, SHIP_SHEETS/
      SHIP_COUNT переехали в pixi-free ships.ts); bootstrap - тонкая обёртка
      (ticker, measureText на pixi, viewerStore). createHeadlessGame в
      headless.ts: stub ViewerStore, measureText = estimateWordSize, экран
      1920x1080 по умолчанию. Smoke-тест headless.spec.ts: 15 сек прогона без
      pixi - PLAYING, зритель и слова на месте
- [x] 5. драйвер ботов под режим !игра: balance/sim.ts (runSimulation) - печать
      (reaction + len/cps -> shoot с реальным полётом пули), клейм старейшего
      приземлившегося слова, расписания щитов (shieldUptime/duration) и батареек
      (grantsPerHour + авто-repair ниже порога), SimStats из world через
      onEntityAdded (words/armed/enemyShot) и переходы dead. Статы и вайп
      считаются только в PLAYING (в STARTING сущности зрителей пересоздаются -
      stale-снимок давал ложный вайп). Тесты в sim.spec.ts: детерминизм по seed,
      контроль слов активными ботами, вайп пассивного лобби при p=1
- [x] 6. sim.ts переписан на headless ECS (старая отдельная модель удалена),
      averageStats там же; sim.spec.ts - sanity-тесты + генерация
      docs/balance.md по требованию (CALIBRATE=1 npx vitest run ..., иначе
      skip - npm test остаётся быстрым). Сетка 5 шансов x 3 total x баффы, 10
      прогонов на ячейку (~8 мин на ECS). Находка: при текущих константах вайпа
      НЕТ даже при p=1 - см. пункт в балансе ниже

### План: SSE вместо polling (выполнен)

Push-канал сервер -> виджет вместо GET /api/effects раз в 10 сек. Попутно
починился баг с таймаутом: poll щита освежал lastSeen каждые 10 сек
(bootstrap.ts), зритель со щитом не удалялся по VIEWER_TIMEOUT_MS - теперь
joinViewer по щиту раз на событие.

- [x] 1. subscribers в reward-effects.ts: `__effectSubscribers` в globalThis
      рядом с queues/shields, subscribeEffects/hasEffectSubscribers + EffectPush
      ({ shields, effects } - тот же shape, что был у GET). queueEffect пушит
      вместо очереди, когда есть подписчики (иначе двойной грант батареек при
      drain на реконнекте); без подписчиков - в очередь (буфер до коннекта,
      pendingCount-лимиты не тронуты). grantShield пушит новый щит
- [x] 2. эндпойнт /api/effects/stream: GET по ?uuid= (broadcasters.byUuid),
      Response(ReadableStream), text/event-stream + no-cache +
      X-Accel-Buffering: no. При коннекте: ensureRewardEffects, subscribe строго
      до снапшота getRewardEffects (гонка без потерь), отписка на abort/cancel -
      Set подписчиков не растёт при перезагрузке OBS
- [x] 3. heartbeat ":"-комментарий каждые 25 сек, общий stop() гасит таймер и
      подписку; упавший enqueue = мёртвый сокет
- [x] 4. клиент: poller.ts -> stream.ts (EventSource, реконнекты из коробки),
      старт после bootstrapGame (снапшот не падает на неготовую игру), close() в
      cleanup GameWidget. Старый GET /api/effects удалён
- [x] 5. проверки: curl -N в dev и prod (bun build-node) - снапшот мгновенно,
      heartbeat каждые 25 сек, 404 на чужой uuid; подтверждено на живом канале
- [x] 6. nginx не понадобился - X-Accel-Buffering: no из приложения достаточно

Попутный фикс: 500 на PUT /api/storage - request.json() без catch падал на битом
теле; readJson с try/catch -> 400, добавлен hooks.server.ts с handleError (стек
5xx в stderr, logger в prod noop)

- [x] коллизия смыслов expired: тег значил и "удалить в конце кадра" (cleanup),
      и "TTL слова кончился -> вооружить" - clearScene при !игра вооружал все
      слова (краснели и обстреливали зрителей во время отсчёта). Разделено:
      timedOut (TTL кончился) -> armed (красное, стреляет) -> expired (удалить);
      lifetime ставит timedOut, enemy-attack конвертирует timedOut->armed (без
      expired), clearScene деспавнит честно
- [x] аудит статик-билда: слой 1 - eslint-зона, запрет импорта #lib/server,
      @twurple/api|auth|eventsub, $app/env/private, node:* вне серверных зон
      (probe-тестом подтверждено; minimatch ест # как комментарий - паттерн
      ?lib/server/**); слой 2 - scripts/check-static-build.mjs сканирует build/
      на секреты/node:sqlite/quoted /api и /auth/twitch, встроен в build:static;
      чтобы пройти честно: variant-флаг через vite define (**APP_VARIANT_NODE**
      -> REWARDS_ENABLED, rollup вырезает мёртвые ветки), кабинет и виджет -
      variant-свичи со заглушками FullVersionStub, TopBar brand-only, identity в
      CabinetPage
- [x] списание и возврат баллов: настройки autoFulfillment и autoRefund
      (boolean, scope full; авто-возврат включён по умолчанию, автосписание
      выключено) в SETTINGS_SCHEMA; reward-effects считает лимит как stored
      (sqlite viewers) + pending в очереди эффектов, сверх лимита + autoRefund -
      редим CANCELED (баллы возвращаются, эффект не выдаётся); autoFulfillment -
      выданные редимы помечаются FULFILLED через updateRedemptionStatusByIds
- [x] dev: сброс APP_VARIANT (index отправлял на duckdns): воспроизведено по
      data/debug-index.log (variant=static при raw=node) - vitest (mode=test) и
      svelte-kit sync перезаписывали .svelte-kit/generated/dev/env без
      APP_VARIANT, схема запекала static; фикс: .env.test (коммитится) и
      .env.dev.local (локально) с APP_VARIANT=node, скрипт dev явно
      APP_VARIANT=static через cross-env; debug-лог в routes/+page.ts можно
      удалить после подтверждения
- [x] показывать список награды за баллы, созданные приложением
- [x] сделать настройку стоимости, названия и кулдауна наград (отдельно на
      каждую награду на странице конфигурации и создание и обновление наград
      через twitch api с этими параметрами)
- [x] страница конфигурации + масштаб кораблей: SETTINGS_SCHEMA (key/param,
      scope static|full, валидация), parseSettings/serializeSettings/
      normalizeSettings + тесты; ctx.settings в игре вместо константы
      VIEWER_SCALE; статик - /settings со слайдером и автосборкой ссылки
      /game?channel&viewer_scale (кнопка "настройки" в ScoutCard), полная
      версия - SettingsCard в кабинете, kv-storage в sqlite +
      /api/storage/settings (cookie или uuid), виджет мержит defaults < сервер <
      url params
- [x] главная страница с понятным выбором: обрезанная - статическая на github
      pages или полная - на моем бекенде. четко описать - не доверяете - вводите
      имя и играйте в статику. хотитет доп возможностей - подключайте полный
      бекенд со всеми фичами
- [x] автосписание баллов (fullfilment) по умолчанию должно быть выключено
- [x] спрятать uuid из кабинета: cookie-сессии после twitch oauth (таблица
      sessions, httpOnly sw_session, 30 дней), кабинет на чистом /cabinet без
      параметров, /api/broadcaster и /api/rewards резолвят broadcaster по cookie
      или uuid (uuid - для виджета в OBS), logout чистит сессию; ротация uuid -
      POST /api/broadcaster + кнопка "сбросить ссылку" в кабинете
- [x] перенести все uuid в url params - браузер отображает путь полностью, но
      скрывает url params: кабинет /[uuid] -> /cabinet?uuid=, виджет
      /widget/[uuid] -> /widget?uuid=, storage /api/storage/[uuid]/[key] ->
      /api/storage/[key]?uuid=, редирект callback на /cabinet?uuid=
- [x] аварийный маяк за баллы (400, лимит 1): жетон возрождения на счет (не
      сгорает вне игры), авто-расход при смерти в активной игре - возрождение
      через 5 сек на месте; reward, /api/effects dispatch, персистенс
- [x] режимы игры: - основной: более спокойный, чтобы чат не спамил - игра: один
      раунд до разрушения всех кораблей зрителей - волны\боссы - афк: пока
      стример отошел - более активные враги или циклический перезапуск игры
- [x] анимация промаха\рикошета: снаряд с damage 0 отскакивает вверх с двойной
      скоростью, вращается по вектору и сжимается до 0 за 0.6 сек
      (enemy-shot-hit + ricochet + ricochet-render)
- [x] рефакторинг наград: subscribeAllRedemptions (все редимы канала, не только
      игровые) + reward-effects.ts (маппинг rewardId->key, щит как состояние,
      остальное очередью) + единый /api/effects; любой редим спавнит зрителя;
      shields.ts/batteries.ts и их эндпойнты удалены
- [x] если игрок активировал любую награду - его должно заспавнить, а если
      активировал щит или другой бафф - сразу выдать награду
- [x] батарейки за баллы канала (200 баллов, лимит 5, +3 hp): reward,
      /api/batteries grants, команды `!rep` / `!repair @user`, персистенс в
      viewerStore; hp реген убран - восстановление только батареями
- [x] цикл игры - волна врагов, игра до последнего умершего зрителя, надо
      отбалансировать щит
- [x] изменить persistance - static - localstorage, node - server
- [x] node sqlite - вместо json файлов
- [x] persistence: добавить http-адаптер StoragePort + серверный endpoint
      /api/storage/:key для node-билда (порт и localStorage-адаптер уже есть в
      src/lib/features/persistence)
- [x] сделать сетку на fx картинках, чтобы я могла выбирать анимацию по
      нумерации типа a1-a2-b1-b2

### План: деплой на vps (мульти-стример) (выполнен)

Каждый стример логинится своим твич-аккаунтом (регистрация открытая), получает
свою ссылку виджета для OBS. Данные в sqlite, проект в docker, ci/cd на vps
(домен duckdns, образы в ghcr).

- [x] 1. sqlite (встроенный node:sqlite, без зависимостей): таблицы broadcasters
      (user_id, login, widget uuid, token json), reward_ids (broadcaster_id,
      key, reward_id), viewers (broadcaster_id, user_id, data json)
- [x] 2. мульти-тенантный сервер: twitch-auth - токен на broadcaster в sqlite,
      провайдер/листенер/щиты - Map по broadcaster_id, eventsub WS-листенер на
      каждого активного стримера
- [x] 3. auth + кабинет: callback создаёт broadcaster и редиректит на кабинет
      /[uuid] (uuid = доступ, cookie не понадобилась); виджет на роуте
      /widget/[uuid]
- [x] 4. persistence: http-адаптер StoragePort -> /api/storage/[uuid]/[key],
      viewer-store в sqlite, localStorage для статик-билда; записи только по
      валидному uuid
- [x] 5a. bun локально: сборка adapter-node, запуск bun build-node (bun 1.4.2);
      фикс start-флоу: TWITCH_REDIRECT_URI в src/env.ts (adapter-node считает
      origin https), start = cross-env ORIGIN + bun; node:sqlite и twurple под
      bun
- [x] 5b. docker + ci/cd: multi-stage Dockerfile на oven/bun (prod-deps слой),
      vps docker-compose (volume sqlite, nginx + certbot, порт APP_PORT), GitHub
      Actions: build -> ghcr -> ssh deploy (явный тег latest)

### План: нумерация кадров fx (выполнен)

Цель: кадры спрайт-листов fx (fire, green, purple, water) можно называть меткой
вида "b3" - и по ней однозначно находить кадр. Для этого рядом с листом лежит
картинка с наложенной сеткой и документ-расшифровка.

- [x] 1. скрипт scripts/fx-grid.mjs: читает размер PNG из заголовка (IHDR, без
      зависимостей), по конфигу сетки листа генерит рядом `<name>.grid.svg` -
      сама картинка + линии сетки + подписи меток (ряд = буква сверху вниз,
      колонка = число слева направо)
- [x] 2. прогнать для всех листов fx, открыть .grid.svg в браузере, сверить
      сетку с реальными кадрами, подогнать конфиг сетки под факт (листы могут
      отличаться) - сверено: все 4 листа 576x208, единая сетка 16x16 (36 колонок
      x 13 рядов), подгонка не нужна
- [x] 3. спека static/fx/frames.md пишется по факту сверенных сеток: схема
      меток, формула расшифровки в пиксели, реальные таблицы сеток каждого листа
- [x] 4. helper в коде: метка "b3" -> col/row -> Rectangle, чтобы анимации в
      assets.ts задавать нумерацией, а не сырыми пикселями - frame-label.ts +
      тесты, взрыв (f11 f12 g12 g13) и пуля (e1) переведены на метки

### План: авто-респавн в idle (выполнен)

Убираем защиту на 1 hp в idle - смерть возможна всегда. Цикл перерождения: взрыв
(уже есть), портал в случайном месте зоны игроков (анимация позже,
слот-плейсхолдер), полоска прогресса 10 сек, корабль возвращается с полным hp. В
playing авто-респавна нет - там смерть до конца игры (или респавн по
команде/реварду через game.respawn).

- [x] 1. убрать кламп minHp=1 в enemy-shot-hit - смерть при hp 0 в любой фазе
- [x] 2. компонент respawning { elapsed, duration, x } на зрителе.
      respawnScheduler-система: dead без respawning в фазе idle - ставит
      respawning со случайным x в границах зоны игроков
- [x] 3. respawnSystem: elapsed += dt, при duration - снять dead и respawning,
      hp полное, position.x = x портала
- [x] 4. portal-render (плейсхолдер): простая графика портала в точке (x,
      земля) + полоска прогресса elapsed/duration. Анимацию потом заменим, не
      меняя компонент
- [x] 5. краевые случаи: таймаут зрителя во время респавна (уже удаляется),
      STARTING забирает respawning-зрителей в новую игру живыми (проверить),
      конфиг RESPAWN_DURATION = 10

### План: игровой цикл (выполнен)

Триггер пока - команда `!игра` в чате, но ядро игры про команды не знает: матч
команды в слое, где сообщения уже превращаются в game.shoot(), ядро экспонирует
game.startGame() (триггер потом заменим, поменяется одна строка).

- [x] 1. синглтон-сущность с компонентом session { phase, timer } - фазы: idle,
      starting, playing, ending, gameover. bootstrap создаёт её, startGame()
      меняет компонент. Новые фазы = новые значения enum, не новая архитектура
- [x] 2. sessionSystem (первой в кадре) - оркестратор переходов и таймеров фаз.
      Смена сцены не мгновенная: сущностям ставится компонент despawning
      (анимация исчезновения, потом expired), появление - spawning. Зрители
      респавнятся по сохранённым идентичностям с полным hp
- [x] 3. правило смерти по фазам: idle - hp клампится на минимум 1 (смертей
      нет), playing - 0 разрешён. При смерти игрока: спавн существующей
      explosion на месте корабля + компонент dead (корабль скрывается, walk и
      pickTarget игнорят). Респавн - game.respawn(userId) снаружи (команда чата
      или ревард в REWARD_CONFIGS)
- [x] 4. конец игры: playing + все зрители dead (или viewers.size === 0) -
      баннер "игра завершена" (сущность banner + banner-render), через 10 сек -
      idle, зрители восстанавливаются через существующий restoreViewers
- [x] 5. краевые случаи: заход посреди игры - спавн с полным hp (уже так); все
      вышли по таймауту - gameover. Прогон: !игра, ресет, добивание до 0, баннер
      10 сек, возврат в idle

### ECS-way

- [x] ecs: ввести tag expired + cleanupSystem (удаляет помеченные в конце
      кадра) - база для разделения bullet/lifetime
- [x] ecs: разделить bullet.ts (4 ответственности: homing, коллизия, взрыв,
      награда xp+звезда+persist) - homing отдельно, реакции на попадание
      отдельно
- [x] ecs: объединить homing-движение bullet.ts и enemy-shot.ts - общий
      компонент homing { target, speed } + одна homingSystem, bullet/enemyShot
      остаются данными для своих hit-систем
- [x] ecs: разделить lifetime.ts - система только старит и помечает expired,
      отдельная enemyAttackSystem реагирует на expired + word (pickTarget, спавн
      enemyShot)
- [x] ecs: вынести запись entity.size из viewer-render.ts:70 в отдельную
      measureSystem до walk - render не должен писать в логику (сейчас size
      отстаёт на кадр, walk читает его в walk.ts:33)
- [x] ecs: вынести спавн зрителей из конструктора viewer-persistence.ts:9-15 в
      bootstrap - side effect в фабрике системы, невидим и неуправляем по
      порядку
- [x] ecs: persistViewers вызывается из 5 мест (bullet, viewer-timeout,
      bootstrap x3, viewer-persistence) - заменить на dirty-флаг/событие
      "viewers changed" + один подписчик
- [x] оптимизация, вроде world.with("word", "position") должен быть реактивным и
      можно обходить цикл на одной переменной во внешнем скоупе - проверено: в
      системах всё уже в фабриках, подняты запросы в bootstrap
