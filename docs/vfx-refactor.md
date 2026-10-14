# План рефакторинга VFX

Реализация трёх задач из [backlog.md](./backlog.md): весь визуал в
`src/lib/vfx/`, обязательный визуал у каждой награды, переработка щита.

Решения, принятые при планировании:

- единый интерфейс эффектов, общий для `viewer-render.ts` и страницы `/view`;
- реакция на событие — один компонент ECS вместо четырёх (`spark`, `ricochet`,
  `star`, `explosion`);
- щит — шейдер с переливом жидкости, производительность пока не ограничиваем
  (тестируем на 10 зрителях);
- поведение при перезагрузке страницы не учитываем, спец-guard не нужен;
- пипсы зарядов щита остаются, вопрос закрывается позже.

## Архитектура

Три слоя, у каждого одна роль:

| Слой      | Где             | Отвечает за      |
| --------- | --------------- | ---------------- |
| ECS       | `game/types.ts` | **когда и где**  |
| Рисование | `src/lib/vfx/*` | **как выглядит** |
| Слой      | `vfx/layer.ts`  | **обслуживание** |

```
src/lib/vfx/
  kinds.ts        БЕЗ Pixi. REACTION_KINDS, AURA_KINDS
  types.ts        контракты: VfxFrame, VfxReaction, VfxAura, VfxFilter
  layer.ts        createVfxLayer(stage): add / move / remove / update / destroy
  registry.ts     kind → фабрика (здесь Pixi)
  shield.ts       шейдерный щит с переливом
  shimmer.ts      перенос metal-shimmer.ts
  reactions.ts    все одноразовые отклики
  auras.ts        doomsday / portal / overcharge
  layer.spec.ts   тест с фейковым stage
```

`kinds.ts` отделён от `registry.ts` намеренно: `rewards/config.ts` импортирует
только типы из `kinds.ts`, иначе Pixi попадёт в серверный бандл
(`reward-effects.ts` → `rewards/config.ts`) и сломает static build.

`RenderContext` получает поле `vfx: VfxLayer` (`context.ts:21-24`). Слой
создаётся один раз в `core.ts` рядом с `app`, уничтожается в `dispose`. Все
рендер-системы получают его бесплатно. `layer.ts` не знает про ECS — только про
`Container`.

### Контракты

```ts
interface VfxReaction {
  readonly root: Container;
  update(frame: VfxFrame): void;
  destroy(): void;
}

interface VfxAura<S> {
  readonly root: Container;
  update(frame: VfxFrame, state: S): void;
  destroy(): void;
}

interface VfxFrame {
  dt: number; // кадр
  t: number; // накопленное время, растёт на dt
  x: number; // мировая позиция
  y: number;
  scale: number; // масштаб мира
  phase: number; // сид для десинхронизации соседних кораблей
}
```

`performance.now()` из эффектов уходит целиком: время приходит от хоста. В игре
— накопленный `dt`, на `/view` — дельта тикера. Побочная выгода: эффекты
становятся тестируемыми (передаёшь `t` руками).

## Единый отклик

```ts
export interface Vfx {
  kind: ReactionKind;
  age: number;
  ttl: number;
  seed: number; // вариация, чтобы соседние отклики не были идентичны
  value?: number; // цвет/сила для конкретного вида
}
```

Виды: `ship-hit`, `ship-ricochet`, `word-destroyed`, `bullet-miss`,
`viewer-destroyed`, `doomsday`, `timestop`, `reward`.

Сносятся 8 файлов:

```
systems/spark.ts            systems/spark-render.ts
systems/ricochet.ts         systems/ricochet-render.ts
systems/star.ts             systems/star-render.ts
systems/explosion.ts        systems/explosion-render.ts
```

`enemy-shot-hit.ts:25-53` — 28 строк создания искр и рикошета схлопываются в
одну строку `ctx.world.add({ position, vfx: { kind: "ship-hit", ... } })`.

Константы `SPARK_*`, `RICOCHET_TTL`, `STAR_*`, `EXPLOSION_FRAME_DURATION`,
`EXPLOSION_SCALE` переезжают в `vfx/reactions.ts`. `EXPLOSION_FRAME_LABELS`
остаётся в `game/config.ts` — он нужен `assets.ts:72` для нарезки кадров.

## Шейдерный щит

`metal-shimmer.ts` — готовый образец: `Filter.from({gl})` + uniform'ы `f32`,
мутация без пересборки. Щит делается так же.

Uniform'ы: `uTime`, `uCharge` (hp/3), `uHit` (затухание после попадания),
`uHitDir` (направление удара), `uRadius`, `uScale`.

Искажение при попадании — без новой сущности: в `Shield` добавляется
`hitAt?: number`, ставится в `enemy-shot-hit.ts:61` рядом с `regenIn`. Аура
считает `uHit` как `1 - (now - hitAt) / 0.4`. Работает в headless, тестируется,
ноль связности.

Пипсы зарядов — отдельным `Graphics` поверх шейдера, все радиусы умножаются на
`scale`. Это и есть текущий баг: `shield-bubble.ts:4-5,57` задают радиусы в
абсолютных пикселях при уже скейленном пузыре.

## Визуал в награде

```ts
export type RewardVisual =
  | { kind: "aura"; aura: AURA_KINDS; reaction?: REACTION_KINDS }
  | { kind: "reaction"; reaction: REACTION_KINDS };

export interface RewardConfig {
  key: string;
  title: string;
  description: string;
  cost: number;
  cooldown: number;
  visual: RewardVisual;
}
```

Поле обязательное плюс `satisfies` — награда без визуала не компилируется.

| Награда     | visual                                        |
| ----------- | --------------------------------------------- |
| shield      | aura `shield` + reaction                      |
| ricochetium | aura `shimmer` + reaction                     |
| overcharge  | aura `overcharge` (новая аура) + reaction     |
| doomsday    | reaction `doomsday` (устройство уже рисуется) |
| timestop    | reaction `timestop` (плюс текущий tint слов)  |
| battery     | reaction `reward`, золотой                    |
| revive      | reaction `reward`, зелёный                    |
| beacon      | reaction `reward`, голубой                    |

Реакция спавнится в `core.ts` в ветке **нового** добавления компонента
(`if (!entity.shield) { ... }`), без отдельного guard'а на реhydration.

---

## Чеклист

Проверка после каждого шага: `npm run check && npm run lint && npm test`.

### Шаг 1. Инфраструктура vfx — 1.5 ч

Выполнен первым: от него зависит шаг 0.

- [x] `vfx/kinds.ts`: `REACTION_KINDS`, `AURA_KINDS` (без Pixi)
- [x] `vfx/types.ts`: `VfxFrame`, `VfxReaction`, `VfxAura`, `VfxFilter`
- [x] `vfx/layer.ts`: `add`, `move`, `remove`, `update`, `destroy`
- [x] `vfx/registry.ts`: `kind → фабрика` — перенесён в шаг 2, фабрик ещё нет
- [x] `vfx/layer.spec.ts`: фейковый `stage` + фейковые эффекты, порядок
      add/move/remove, накопление `t`

### Шаг 0. Слой в контексте — 30 мин

- [x] `context.ts`: добавить `vfx: VfxLayer` в `RenderContext`
- [x] `core.ts`: создать слой рядом с `app`, снести в `dispose`
- [x] `viewer-persistence.spec.ts:104-113`: фейк не понадобился — фейковая сцена
      уже умеет `addChild`
- [x] `npm run check && npm run test`

### Шаг 2. Перенос shield и shimmer — 2 ч

Картинка меняется только здесь: фикс масштаба щита.

- [x] `vfx/shield.ts` ← `vfx/shield-bubble.ts` (пока Graphics, все размеры через
      `* state.radius`)
- [x] `vfx/shimmer.ts` ← `vfx/metal-shimmer.ts` (`update(frame)`, aspect из
      конфига)
- [x] `vfx/registry.ts`: реестр `kind → фабрика` + `registry.spec.ts`
- [x] `viewer-render.ts`: переписан на `ctx.vfx`, щит и обмазка больше не
      управляются вручную
- [x] `systems/vfx-tick.ts` + подключение последним в `renderGroups()` — время
      слоя качается один раз за кадр
- [x] `ViewShip.svelte`: переписан на слой, три `$effect` с очисткой вместо
      `$effect`-одноразового вызова; чинены тикер и утечка `destroy` фильтра
- [x] удалить `vfx/shield-bubble.ts`, `vfx/metal-shimmer.ts`
- [x] проверить `/view` в браузере: щит вращается, масштабируется, фильтр
      снимается

Виды эффектов разложены на три словаря в `kinds.ts`: `REACTION_KINDS`,
`AURA_KINDS`, `COATING_KINDS`. `shimmer` оказался фильтром, а не аурой, — для
наград это третий вариант `visual`.

`viewer-persistence.spec.ts:109` править не пришлось: фейковая сцена уже умеет
`addChild`, снимок состояния не изменился.

### Шаг 3. Единый отклик — 3 ч

- [ ] `game/types.ts`: добавить `Vfx`, убрать `Spark`/`Ricochet`/`Star`/
      `Explosion` из интерфейсов и `EntityComponents`
- [ ] `vfx/reactions.ts`: все одноразовые отклики + переехавшие константы
- [ ] `systems/vfx.ts` (логика): `age += dt`, `expired` при `ttl`
- [ ] `systems/vfx-render.ts`: создать/тикать/снести по `registry.ts`
- [ ] переписать спавн в `bullet-hit.ts`, `word-kill.ts`, `enemy-shot-hit.ts`
- [ ] удалить 8 файлов систем
- [ ] `systems/index.ts`: убрать 8 фабрик, добавить 2
- [ ] `config.ts`: убрать переехавшие константы
- [ ] `headless.spec.ts:84`: `world.with("explosion")` → `world.with("vfx")`
- [ ] `assets.ts`, `viewer-persistence.spec.ts:109`: поправить моки

### Шаг 4. Ауры doomsday и портала — 1.5 ч

- [ ] `vfx/auras.ts`: `createDoomsdayAura`, `createPortalAura`
- [ ] `doomsday-render.ts`, `portal-render.ts` → тонкие диспетчеры

### Шаг 5. Шейдерный щит — 4 ч

- [ ] `game/types.ts`: `Shield.hitAt?: number`
- [ ] `enemy-shot-hit.ts`: ставить `hitAt`
- [ ] `vfx/shield.ts`: `Filter.from({gl})` с переливом + `uHit`/`uHitDir`
- [ ] пипсы зарядов отдельным Graphics, радиусы через `scale`

### Шаг 6. Визуал в награде — 2.5 ч

- [ ] `rewards/config.ts`: `RewardVisual` + поле в `RewardConfig`
- [ ] заполнить `visual` у всех 8 наград
- [ ] `vfx/auras.ts`: `createOverchargeAura`
- [ ] `core.ts`: реакция при новом добавлении компонента во всех `apply*` /
      `grant*` / `doomsday` / `timeStop`
- [ ] `stream.ts`: проверить, что реакции не сыпятся на весь список
- [ ] `/view`: кнопки из `REWARD_CONFIGS` + `visual`, превью aura и reaction

### Шаг 7. Закрытие задач бэклога

- [ ] `backlog.md`: отметить «отрефакторить эффекты» и «визуал для эффектов»
- [ ] `backlog.md`: отметить «отрефакторить щит», если устраивает
- [ ] обновить ссылки на новые имена файлов в `docs/`
