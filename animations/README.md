> **Обязательные требования:** перед созданием или изменением анимации прочитайте [Технические требования к анимации и адаптивности](../ANIMATION_TECHNICAL_REQUIREMENTS.md). Они определяют безопасные границы кадра, адаптивность текста, поведение при resize и обязательную проверку качества.

# Adding an animation

The viewer discovers animation folders automatically. You do not need to edit `src/core`, `src/ui`, or `src/main.js`.

Create a new folder:

```text
animations/
  002-my-story/
    index.js
    config.js
    script.js
    animation.js
```

## `config.js`

Export the metadata:

```js
export const config = {
  id: '002-my-story',
  order: 2,
  title: 'Animation title',
  duration: 30,
  scriptTitle: 'Full script title',
  scriptNote: 'Optional note'
};
```

## `script.js`

Export an array of timed script sections:

```js
export const script = [
  { time: 0, label: '00:00 · Opening', text: 'Voiceover and scene description.' },
  { time: 8, label: '00:08 · Main idea', text: 'The next part of the script.' }
];
```

## `index.js`

Connect metadata, script, and the scene implementation:

```js
import { config } from './config.js';
import { script } from './script.js';
import { create } from './animation.js';

export default { ...config, script, create };
```

## `animation.js`

Export an async or synchronous `create({ THREE, container })` function. It must return:

- `update(time, delta)` — render the animation at the supplied elapsed time. The time is deterministic and resets to zero when the clip loops.
- `resize(width, height)` — resize the renderer and camera to the animation surface.
- `destroy()` — stop timelines and dispose geometries, materials, textures, renderers, and event listeners.

The viewer owns playback, looping, navigation, the timer, progress bar, and script modal. Do not create a second playback loop inside an animation module.

Use `order` to set playlist order. The viewer scans `animations/*/index.js` at build time and automatically adds valid modules to the playlist.
