# Changelog
All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

- - -
## [0.4.0](https://github.com/Ku6epXBOCTuK/shooting-word-v2/compare/2fbd3302e23264948c341df1eb5c0a03b38ca0be..0.4.0) - 2026-10-07
#### Features
- separate persistance storage, add viewer storage layer - ([37acb89](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/37acb89e64ef80e4d31e1a2f9805df46dec5ef47)) - Ku6epXBOCTuK
- separate viewer persistance - ([a3f4fa6](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/a3f4fa6fd633859306fac2230abef5a899f98d6e)) - Ku6epXBOCTuK
- separate measure system - ([606e667](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/606e667de49252207ded2058169380b3425eb8a6)) - Ku6epXBOCTuK
- separate enemy attack system - ([55de947](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/55de94710c80e1f8294b2049b8e3ee42eacd4cce)) - Ku6epXBOCTuK
- separate homing system - both bullet and enemy-shot use it - ([37ac975](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/37ac975154f47e876f96e3fce8166c572da71f82)) - Ku6epXBOCTuK
- separate bullet to homing system and hit system - ([7bcbb92](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/7bcbb925c2a5b0c99174085927262761a6c248f5)) - Ku6epXBOCTuK
- add cleanup system - ([b4ee8ec](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/b4ee8eca1ab23ed7cbb099be2c6b560a58045ee4)) - Ku6epXBOCTuK
- add rewards flow, add shield reward - ([48cd689](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/48cd68922d12acd79d086c9ff50e4a770bfec243)) - Ku6epXBOCTuK
- update reward flow - create\delete - ([161aaaa](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/161aaaad7c33b95cd27b4574d35969d9c033b6e0)) - Ku6epXBOCTuK
#### Bug Fixes
- hoist queries - ([bb9d10c](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/bb9d10ce2a0f2b2c2c15afdf9b6c6114367c664a)) - Ku6epXBOCTuK
- update twitch auth flow - ([2fbd330](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/2fbd3302e23264948c341df1eb5c0a03b38ca0be)) - Ku6epXBOCTuK

- - -

## [0.3.0](https://github.com/Ku6epXBOCTuK/shooting-word-v2/compare/e9f823145d860cd8a7df8303442d8142bc39c652..0.3.0) - 2026-10-06
#### Features
- add regen hp system - ([cad7c5a](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/cad7c5a2662d6010678b728dc2e7123a9568dc2a)) - Ku6epXBOCTuK
- enemies shoot to viewers - ([178bc14](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/178bc14241b54e3cf1c43c34544ac2a8f7aa7e99)) - Ku6epXBOCTuK
- move obs overlay to game, add index page - ([1df81ae](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/1df81aee3d84684fce1400dcf753c97333755a77)) - Ku6epXBOCTuK
- static and server versions with different features - ([f3dd8fc](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/f3dd8fc64af6f8a5e9535692ae0f4e82f2638d5a)) - Ku6epXBOCTuK
- add hp to ships - ([6a78b52](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/6a78b52ce1d868830dec5685cf97ac069211724f)) - Ku6epXBOCTuK
- add backplate to use as obs overlay - ([e38dcb1](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/e38dcb1dd104b1627c4bcbfeb3b44aa446b50682)) - Ku6epXBOCTuK
- shoot to all enemies with corresponding word - ([6ffe529](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/6ffe529fcb30749008999c799f186afb471cd1b2)) - Ku6epXBOCTuK
- add spaceship skins - ([0aa0fc2](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/0aa0fc2b378228f4995b928916d4587d0bbf6d73)) - Ku6epXBOCTuK
- explosion enemies on hit - ([e9f8231](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/e9f823145d860cd8a7df8303442d8142bc39c652)) - Ku6epXBOCTuK
#### Bug Fixes
- enemies shoot to random viewer if all viewers has 0 hp - ([803700f](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/803700ffe6d6b23bc6d48b9dbd6a3dff584f147e)) - Ku6epXBOCTuK
- enemies progress bar color - ([2458b97](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/2458b978007934cdd9f55478499e9c6f3e755445)) - Ku6epXBOCTuK
- viewers timeout increase - ([f7bc383](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/f7bc383b865a9afa738f1c2abce6624d8897d2f0)) - Ku6epXBOCTuK
- viewers walks in screen range - ([0d7ea3a](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/0d7ea3a19f42d71abf3b41a069e861d0617441a0)) - Ku6epXBOCTuK
- use displayname instead of username - ([1236b19](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/1236b19a3e6c4e53898e6fda07b2b334c790cb74)) - Ku6epXBOCTuK

- - -

## [0.2.0](https://github.com/Ku6epXBOCTuK/shooting-word-v2/compare/a04bfd611948359b45ed2418f00fe0b710aac2b2..0.2.0) - 2026-10-06
#### Features
- add xp star - ([05dc074](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/05dc074eaa1c71033d356b3f94dc6c730d3f60ab)) - Ku6epXBOCTuK
- add expirience to viewer - ([65933c0](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/65933c09d7a21f8f64f036120d10aa44c37a0430)) - Ku6epXBOCTuK
- add shoot ability, bullets - ([1a4f824](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/1a4f82430f9d70cbffdd91652658e03111ceba97)) - Ku6epXBOCTuK
- players persistence and timeout - ([41ad099](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/41ad09954571e81f88eebf2318671884f8b04af5)) - Ku6epXBOCTuK
- box walking players, field - ([37b0993](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/37b0993d77e9df9bb5f1631119db51a981340248)) - Ku6epXBOCTuK
- add enemy spawner - ([ab3c461](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/ab3c461ef6886a81603aebb424af3ac04379657e)) - Ku6epXBOCTuK
- add perspective flight and lifetime - ([ebea6c0](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/ebea6c0ceee4ac8cb0f55f27651c16b08662998d)) - Ku6epXBOCTuK
- add miniplex, base ecs components and systems - ([befc3e4](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/befc3e4f69a834d0dc9546b5ba32855de852ee8d)) - Ku6epXBOCTuK
- add twitch port and adapter - ([b037f73](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/b037f73d812851abc65274912a8c25c0f69b85fa)) - Ku6epXBOCTuK
#### Bug Fixes
- hmr 500 error, pixi destroy flow - ([566b5c9](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/566b5c9b641bdbc2e9cf591248fb65f579f057cd)) - Ku6epXBOCTuK
- enemies dont appear at players areas - ([9a81c7d](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/9a81c7d63955a23b97a16716476e87faecd5076d)) - Ku6epXBOCTuK

- - -

## [0.1.0](https://github.com/Ku6epXBOCTuK/shooting-word-v2/compare/4c14837817055a52121e202015bac9d678891545..0.1.0) - 2026-10-06
#### Features
- scaffold - ([4c14837](https://github.com/Ku6epXBOCTuK/shooting-word-v2/commit/4c14837817055a52121e202015bac9d678891545)) - Ku6epXBOCTuK

- - -

Changelog generated by [cocogitto](https://github.com/cocogitto/cocogitto).