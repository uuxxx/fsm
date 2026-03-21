# @uuxxx/fsm-vue

[![npm version](https://badge.fury.io/js/@uuxxx%2Ffsm-vue.svg)](https://badge.fury.io/js/@uuxxx%2Ffsm-vue)

Vue 3 bindings for [@uuxxx/fsm](https://github.com/uuxxx/fsm) — a lightweight, type-safe finite state machine library.

## Installation

```bash
npm install @uuxxx/fsm-vue @uuxxx/fsm
# or
pnpm add @uuxxx/fsm-vue @uuxxx/fsm
# or
yarn add @uuxxx/fsm-vue @uuxxx/fsm
```

## Quick Start

```vue
<script setup lang="ts">
import { useFsm } from '@uuxxx/fsm-vue';

type State = 'idle' | 'loading' | 'success' | 'error';

const { state, allStates, start, succeed, fail, reset } = useFsm({
	init: 'idle',
	states: ['idle', 'loading', 'success', 'error'],
	transitions: {
		start: { from: 'idle', to: 'loading' },
		succeed: { from: 'loading', to: 'success' },
		fail: { from: 'loading', to: 'error' },
		reset: { from: ['success', 'error'], to: 'idle' },
	},
});
</script>

<template>
	<p>Current state: {{ state }}</p>
	<button @click="start" :disabled="state !== 'idle'">Start</button>
	<button @click="reset" :disabled="state !== 'success' && state !== 'error'">Reset</button>
</template>
```

## API

### `useFsm(config)`

A Vue composable that creates a reactive FSM instance. Accepts the same config as [`makeFsm`](https://github.com/uuxxx/fsm/tree/main/packages/core#makefsmconfig) from `@uuxxx/fsm`.

#### Returns

| Property             | Type                           | Description                                        |
| -------------------- | ------------------------------ | -------------------------------------------------- |
| `state`              | `Readonly<ShallowRef<TState>>` | Reactive current state — updates on transitions    |
| `allStates()`        | `() => TState[]`               | Returns array of all valid states                  |
| _transition methods_ | From config keys               | One method per transition, same signatures as core |
| _plugin APIs_        | From plugin names              | One namespace per plugin                           |

The `state` ref is **readonly** — it can only change through transitions, not by direct assignment.

#### Config

The config object is identical to `@uuxxx/fsm`'s `makeFsm`. See the [core documentation](https://github.com/uuxxx/fsm/tree/main/packages/core) for full details on transitions, lifecycle hooks, plugins, and error handling.

### Lifecycle Hooks

Lifecycle hooks work the same as in the core library. The `onAfterTransition` hook fires after the reactive state is updated:

```ts
const fsm = useFsm({
	init: 'idle',
	states: ['idle', 'loading', 'done'],
	transitions: {
		start: { from: 'idle', to: 'loading' },
		finish: { from: 'loading', to: 'done' },
	},
	methods: {
		onBeforeTransition({ from, to, transition }) {
			console.log(`${from} -> ${to} via ${transition}`);
			return false; // return false to cancel the transition
		},
		onAfterTransition({ from, to }) {
			console.log(`Transitioned from ${from} to ${to}`);
		},
	},
});
```

### Watching State

Since `state` is a Vue ref, you can use it with `watch`, `computed`, and template expressions:

```ts
import { watch, computed } from 'vue';

const { state, start } = useFsm({
	/* ... */
});

const isLoading = computed(() => state.value === 'loading');

watch(state, (newState, oldState) => {
	console.log(`State changed: ${oldState} -> ${newState}`);
});
```

### Using with Plugins

```ts
import { useFsm } from '@uuxxx/fsm-vue';
import { fsmHistoryPlugin } from '@uuxxx/fsm-plugins';

const fsm = useFsm({
	init: 'a',
	states: ['a', 'b', 'c'],
	transitions: {
		goto: { from: '*', to: (s: 'a' | 'b' | 'c') => s },
	},
	plugins: [fsmHistoryPlugin()],
});

fsm.goto('b');
fsm.goto('c');

fsm.state.value; // 'c'
fsm.history.get(); // ['a', 'b', 'c']
fsm.history.back(1); // 'b'
```

## Exports

```ts
import { useFsm, makeFsm } from '@uuxxx/fsm-vue';
import type { FsmConfig, FsmTransition, FsmPlugin, FsmLabel } from '@uuxxx/fsm-vue';
```

| Export          | Description                                    |
| --------------- | ---------------------------------------------- |
| `useFsm`        | Vue composable — reactive FSM                  |
| `makeFsm`       | Re-export from `@uuxxx/fsm` — non-reactive FSM |
| `FsmConfig`     | Config type                                    |
| `FsmTransition` | Transition definition type                     |
| `FsmPlugin`     | Plugin type                                    |
| `FsmLabel`      | State label type (`string`)                    |

## License

[MIT](./LICENSE)
