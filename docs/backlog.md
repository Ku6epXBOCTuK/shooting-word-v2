# Backlog

- [ ] изменить persistance - static - localstorage, node - server
- [ ] node sqlite - вместо json файлов
- [ ] списание баллов (fullfilment) должно настраиваться в конфиге
- [ ] проверить статик билд - чтобы в билде вообще не было недоступных систем,
      ошибок, попыток авторизации и т.д.
- [ ] слова приближаются слишком равномерно\скучно, посмотреть
      скорости\ускорения и возможно какую-то анимацию тряски\удара при остановке
- [ ] оценить, есть ли смысл задать entity id - для удобства поиска цели
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
- [ ] ecs: вынести спавн зрителей из конструктора viewer-persistence.ts:9-15 в
      bootstrap - side effect в фабрике системы, невидим и неуправляем по
      порядку
- [ ] ecs: persistViewers вызывается из 5 мест (bullet, viewer-timeout,
      bootstrap x3, viewer-persistence) - заменить на dirty-флаг/событие
      "viewers changed" + один подписчик
- [ ] оптимизация, вроде world.with("word", "position") должен быть реактивным и
      можно обходить цикл на одной переменной во внешнем скоупе
- [ ] подумать над дружественными словами - по темам или цветам выбирать
- [ ] перерисовать щит <br> ![shield bubble](./images/shield-bubble.avif)
- [ ] писать в чат от имени бот-аккаунта (отдельный токен бота, не основного
      стримера)
