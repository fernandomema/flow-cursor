<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/ZumitoTeam/zumito-framework">
    <img src="static/logo.png" alt="Logo" width="80" height="80"/>
  </a>

  <h3 align="center">Flow Cursor</h3>

  <p align="center">
    The cursor that flow on the web!
    <br />
    <a href="https://docs.zumito.dev/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://docs.zumito.dev/"><strong>Demo »</strong></a>
    ·
    <a href="https://github.com/ZumitoTeam/zumito-framework/issues">Report Bug</a>
    ·
    <a href="https://github.com/ZumitoTeam/zumito-framework/issues">Request Feature</a>
  </p>
</div>
<img width="100%" src="static/record.gif" alt="demo gif"/>

Based on the work of [CatsJuice/ipad-cursor](https://github.com/CatsJuice/ipad-cursor) effect, ported
natively to **Svelte 5** — same algorithm, same defaults, no `data-cursor` attributes
required.

```svelte
<script>
  import { flowCursor } from 'flow-cursor';
</script>

<div use:flowCursor={{ type: 'block' }}>Block cursor</div>
<span use:flowCursor={{ type: 'text' }}>Text cursor</span>
```

A Svelte **action** auto-initialises the controller on first use, registers the host
element, and tears everything down when the element is removed. The original
imperative API (`initCursor`, `disposeCursor`, `updateCursor`, `updateConfig`,
`customCursorStyle`, `resetCursor`) is also re-exported for users that need it.

## Install

```sh
npm install flow-cursor
```

Peer dependency: `svelte ^5.0.0`.

## Usage

### Action API (recommended)

The action is the idiomatic Svelte entry point. It runs in the browser only and
lazily initialises the controller the first time it sees a host element.

```svelte
<script>
  import { flowCursor } from 'flow-cursor';
</script>

<!-- Block cursor that hugs the host element -->
<div use:flowCursor={{ type: 'block' }}>…</div>

<!-- Text cursor: a thin vertical bar matching the host's font-size -->
<p use:flowCursor={{ type: 'text' }}>…</p>

<!-- Per-element style override (merged on top of `blockStyle`) -->
<div
  use:flowCursor={{
    type: 'block',
    style: { background: 'rgba(124, 92, 255, 0.4)', radius: '50%' }
  }}
>
  …
</div>
```

You can also pass a `data-cursor-style` compatible string:

```svelte
<div
  use:flowCursor={{ type: 'block', style: 'background: red; radius: 8px' }}
>
  …
</div>
```

#### Initial config

If you need to customise the cursor before any action runs, pass
`initConfig` to the action — it is forwarded to the lazy `init()` call:

```svelte
<div
  use:flowCursor={{
    type: 'block',
    initConfig: { enableLighting: true, adsorptionStrength: 18 }
  }}
>
  …
</div>
```

…or call `initCursor(config)` explicitly from `<script>` / `onMount`.

### Imperative API (mirrors `ipad-cursor`)

```svelte
<script>
  import { onDestroy, onMount } from 'svelte';
  import { initCursor, disposeCursor, updateConfig } from 'flow-cursor';

  onMount(() => initCursor({ enableLighting: true }));
  onDestroy(() => disposeCursor());

  // Reactive: re-applied when `theme` changes
  $effect(() => {
    updateConfig({ normalStyle: { background: 'rgba(0,0,0,0.5)' } });
  });
</script>
```

The `data-cursor="text"` / `data-cursor="block"` attributes still work — call
`updateCursor()` after you mutate the DOM, or pass `enableAutoUpdateCursor: true`
in the config.

## API

### `flowCursor` action

```ts
import type { Action } from 'svelte/action';

const flowCursor: Action<HTMLElement, {
  type: 'text' | 'block' | 'normal';
  style?: IpadCursorStyle | Record<string, any> | string;
  initConfig?: IpadCursorConfig;
}>;
```

| Prop        | Type                                            | Notes                                                            |
| ----------- | ----------------------------------------------- | ---------------------------------------------------------------- |
| `type`      | `'text' \| 'block' \| 'normal'`                 | `'normal'` removes the binding.                                  |
| `style`     | `IpadCursorStyle` \| `Record<string, any>` \| `string` | Merged on top of the matching style. Accepts the legacy string. |
| `initConfig`| `IpadCursorConfig`                              | Applied on the first `init()` call only.                         |

### `cursor` controller

The shared singleton — useful for advanced integrations or for reading
`cursor.ready` from a component.

```svelte
<script>
  import { cursor } from 'flow-cursor';
</script>

{#if cursor.ready}
  <p>Cursor is live.</p>
{/if}
```

### Functions

| Function                              | Description |
| ------------------------------------- | ----------- |
| `initCursor(config?)`                 | Mount the fake cursor. Idempotent. |
| `disposeCursor()`                     | Tear it down. |
| `updateCursor()`                      | Re-scan `data-cursor` elements (imperative API). |
| `updateConfig(config)`                | Deep-merge a config patch. |
| `customCursorStyle(style)`            | Build a `data-cursor-style` string. |
| `resetCursor()`                       | Clear any active hover. |
| `CursorType.TEXT` / `CursorType.BLOCK`| String constants for the imperative API. |

## Configuration

`IpadCursorConfig` mirrors the original library 1:1 — see
[`src/lib/types.ts`](./src/lib/types.ts) for the canonical reference.

| Key                      | Type                          | Default          |
| ------------------------ | ----------------------------- | ---------------- |
| `adsorptionStrength`     | `number` (0–30)               | `10`             |
| `className`              | `string`                      | `'ipad-cursor'`  |
| `blockPadding`           | `number \| 'auto'`            | `'auto'`         |
| `enableAutoTextCursor`   | `boolean`                     | `false`          |
| `enableAutoUpdateCursor` | `boolean`                     | `false`          |
| `enableLighting`         | `boolean`                     | `false`          |
| `enableMouseDownEffect`  | `boolean`                     | `false`          |
| `normalStyle`            | `IpadCursorStyle`             | (see defaults)   |
| `textStyle`              | `IpadCursorStyle`             | (see defaults)   |
| `blockStyle`             | `IpadCursorStyle`             | (see defaults)   |
| `mouseDownStyle`         | `IpadCursorStyle`             | (see defaults)   |

Each `IpadCursorStyle` accepts: `width`, `height`, `radius`, `durationBase`,
`durationPosition`, `durationBackdropFilter`, `background`, `border`, `zIndex`,
`scale`, `backdropBlur`, `backdropSaturate`. Set `radius: 'auto'` on
`blockStyle` to inherit the host element's `border-radius`.

## Develop

```sh
npm install
npm run dev      # demo + library in one dev server
npm run check    # type-check
npm run build    # build the library
```

## License

MIT — based on [CatsJuice/ipad-cursor](https://github.com/CatsJuice/ipad-cursor)
(MIT).
