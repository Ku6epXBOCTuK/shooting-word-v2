# Backlog

- [ ] слова приближаются слишком равномерно\скучно, посмотреть
      скорости\ускорения и возможно какую-то анимацию тряски\удара при остановке
- [ ] пересмотреть системы, возможно стоит разделить - система viewer-timeout
      делает 2 вещи - вычисляет время и удаляет, система walk - тоже как будто
      2мя вещами занимается
- [ ] оценить, есть ли смысл задать entity id - для удобства поиска цели
- [ ] bullet система, слишком много вещей делает - перемещение, удаление себя,
      удаление врага и т.д.
- [ ] оптимизация, вроде world.with("word", "position") должен быть реактивным и
      можно обходить цикл на одной переменной во внешнем скоупе
- [ ] hmr выдает ошибку

      ```
      client-warnings.js?v=120a47e0:136 [sveltekit] hmr_reload_after_error
      The next HMR update will cause the page to reload
      [https://svelte.dev/e/kit/hmr_reload_after_error](https://svelte.dev/e/kit/hmr_reload_after_error)
      app.js:16 TypeError: Cannot read properties of null (reading 'remove')
      at Object.destroy (bootstrap.ts:87:15)
      at +page.svelte:22:10
      ```
