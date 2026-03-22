# @uuxxx/fsm

[![npm version](https://badge.fury.io/js/@uuxxx%2Ffsm.svg)](https://badge.fury.io/js/@uuxxx%2Ffsm)

A lightweight, type-safe finite state machine library for TypeScript with plugin support, lifecycle hooks, and full type inference.

## Features

- **Full type inference** — transition methods, states, and plugin APIs are auto-generated from config
- **Multiple transition types** — static, dynamic, async, wildcard (`*`), and multi-source
- **Lifecycle hooks** — `onBeforeTransition` (with veto) and `onAfterTransition`
- **Plugin system** — extend your FSM with custom APIs
- **Framework bindings** — first-class React and Vue support
- **Custom error handling** — provide an `onError` callback or let errors throw

## Packages

| Package                                    | Description                        |                                                                                                               |
| ------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [`@uuxxx/fsm`](./packages/core)            | Core FSM library                   | [![npm](https://badge.fury.io/js/@uuxxx%2Ffsm.svg)](https://www.npmjs.com/package/@uuxxx/fsm)                 |
| [`@uuxxx/fsm-plugins`](./packages/plugins) | Official plugins (history)         | [![npm](https://badge.fury.io/js/@uuxxx%2Ffsm-plugins.svg)](https://www.npmjs.com/package/@uuxxx/fsm-plugins) |
| [`@uuxxx/fsm-react`](./packages/react)     | React bindings (`useFsm` hook)     | [![npm](https://badge.fury.io/js/@uuxxx%2Ffsm-react.svg)](https://www.npmjs.com/package/@uuxxx/fsm-react)     |
| [`@uuxxx/fsm-vue`](./packages/vue)         | Vue bindings (`useFsm` composable) | [![npm](https://badge.fury.io/js/@uuxxx%2Ffsm-vue.svg)](https://www.npmjs.com/package/@uuxxx/fsm-vue)         |

## Quick Start

### Vanilla TypeScript

```bash
npm install @uuxxx/fsm
```

```typescript
import { makeFsm } from '@uuxxx/fsm';

type State = 'idle' | 'loading' | 'success' | 'error';

const fsm = makeFsm({
	init: 'idle',
	states: ['idle', 'loading', 'success', 'error'],
	transitions: {
		start: { from: 'idle', to: 'loading' },
		succeed: { from: 'loading', to: 'success' },
		fail: { from: 'loading', to: 'error' },
		reset: { from: ['success', 'error'], to: 'idle' },
	},
});

fsm.state(); // 'idle'
fsm.start(); // 'loading'
fsm.succeed(); // 'success'
fsm.reset(); // 'idle'
```

### React

```bash
npm install @uuxxx/fsm-react @uuxxx/fsm
```

```tsx
import { useFsm } from '@uuxxx/fsm-react';

function App() {
	const { state, start, reset } = useFsm({
		init: 'idle',
		states: ['idle', 'loading', 'done'],
		transitions: {
			start: { from: 'idle', to: 'loading' },
			finish: { from: 'loading', to: 'done' },
			reset: { from: 'done', to: 'idle' },
		},
	});

	return <p>State: {state}</p>;
}
```

State updates trigger re-renders via `useSyncExternalStore`. See the [full docs](./packages/react).

### Vue

```bash
npm install @uuxxx/fsm-vue @uuxxx/fsm
```

```vue
<script setup lang="ts">
import { useFsm } from '@uuxxx/fsm-vue';

const { state, start, reset } = useFsm({
	init: 'idle',
	states: ['idle', 'loading', 'done'],
	transitions: {
		start: { from: 'idle', to: 'loading' },
		finish: { from: 'loading', to: 'done' },
		reset: { from: 'done', to: 'idle' },
	},
});
</script>

<template>
	<p>State: {{ state }}</p>
</template>
```

`state` is a readonly `ShallowRef` — works with `watch`, `computed`, and templates. See the [full docs](./packages/vue).

## Core Concepts

### Transitions

Each key in `transitions` becomes a typed method on the FSM instance.

```typescript
const transitions = {
	// Static: always goes to 'loading'
	start: { from: 'idle', to: 'loading' },

	// Multi-source: callable from multiple states
	reset: { from: ['success', 'error'], to: 'idle' },

	// Wildcard: callable from any state
	goto: { from: '*', to: (target: State) => target },

	// Async: returns Promise<TState>
	fetch: {
		from: 'idle',
		to: async () => {
			const res = await fetchData();
			return res.ok ? 'success' : 'error';
		},
	},
};
```

### Lifecycle Hooks

```typescript
const fsm = makeFsm({
	// ...config
	methods: {
		onBeforeTransition({ transition, from, to, args }) {
			return false; // return false to cancel
		},
		onAfterTransition({ transition, from, to }) {
			console.log(`${from} -> ${to}`);
		},
	},
});
```

### Plugins

Plugins add namespaced methods to the FSM instance.

```typescript
import { historyPlugin } from '@uuxxx/fsm-plugins/history';

const fsm = makeFsm({
	// ...config
	plugins: [historyPlugin()],
});

fsm.goto('b');
fsm.goto('c');
fsm.history.get(); // ['a', 'b', 'c']
fsm.history.back(1); // 'b' (moves pointer, does NOT change FSM state)
fsm.history.canBack(); // true
fsm.history.current(); // 'b'
```

See the [core docs](./packages/core) for the full API reference, including error handling, plugin authoring, and exported types.

## Development

```bash
pnpm install --frozen-lockfile  # install dependencies
pnpm build                      # build all packages
pnpm test                       # run all tests
pnpm check:types                # type check all packages
pnpm lint                       # lint
pnpm fmt                        # format
```

## License

[MIT](./LICENSE)
