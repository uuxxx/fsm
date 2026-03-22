# @uuxxx/fsm-react

[![npm version](https://badge.fury.io/js/@uuxxx%2Ffsm-react.svg)](https://badge.fury.io/js/@uuxxx%2Ffsm-react)

React bindings for [@uuxxx/fsm](https://github.com/uuxxx/fsm) — a lightweight, type-safe finite state machine library.

## Installation

```bash
npm install @uuxxx/fsm-react @uuxxx/fsm
# or
pnpm add @uuxxx/fsm-react @uuxxx/fsm
# or
yarn add @uuxxx/fsm-react @uuxxx/fsm
```

## Quick Start

```tsx
import { useFsm } from '@uuxxx/fsm-react';

type State = 'idle' | 'loading' | 'success' | 'error';

function App() {
	const { state, start, succeed, fail, reset } = useFsm({
		init: 'idle',
		states: ['idle', 'loading', 'success', 'error'],
		transitions: {
			start: { from: 'idle', to: 'loading' },
			succeed: { from: 'loading', to: 'success' },
			fail: { from: 'loading', to: 'error' },
			reset: { from: ['success', 'error'], to: 'idle' },
		},
	});

	return (
		<div>
			<p>Current state: {state}</p>
			<button onClick={start} disabled={state !== 'idle'}>
				Start
			</button>
			<button onClick={reset} disabled={state !== 'success' && state !== 'error'}>
				Reset
			</button>
		</div>
	);
}
```

## API

### `useFsm(config)`

A React hook that creates a reactive FSM instance. Accepts the same config as [`makeFsm`](https://github.com/uuxxx/fsm/tree/main/packages/core#makefsmconfig) from `@uuxxx/fsm`.

Uses `useSyncExternalStore` under the hood, so state updates are concurrent-mode safe and cause re-renders only when the FSM state actually changes. The FSM instance is created once and persists across re-renders.

#### Returns

| Property             | Type              | Description                                        |
| -------------------- | ----------------- | -------------------------------------------------- |
| `state`              | `TState`          | Current state — triggers re-render on change       |
| `allStates()`        | `() => TState[]`  | Returns array of all valid states                  |
| _transition methods_ | From config keys  | One method per transition, same signatures as core |
| _plugin APIs_        | From plugin names | One namespace per plugin                           |

#### Config

The config object is identical to `@uuxxx/fsm`'s `makeFsm`. See the [core documentation](https://github.com/uuxxx/fsm/tree/main/packages/core) for full details on transitions, lifecycle hooks, plugins, and error handling.

### Lifecycle Hooks

Lifecycle hooks work the same as in the core library. The `onAfterTransition` hook fires after the state is updated and the re-render is triggered:

```tsx
function App() {
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

	// ...
}
```

### Async Transitions

Async transitions work naturally with React. The component re-renders once the promise resolves:

```tsx
function App() {
	const { state, fetchData } = useFsm({
		init: 'idle',
		states: ['idle', 'loading', 'success', 'error'],
		transitions: {
			fetchData: {
				from: 'idle',
				to: async () => {
					const res = await fetch('/api/data');
					return res.ok ? 'success' : 'error';
				},
			},
		},
	});

	return (
		<div>
			<p>{state}</p>
			<button onClick={fetchData} disabled={state !== 'idle'}>
				Fetch
			</button>
		</div>
	);
}
```

### Using with Plugins

```tsx
import { useFsm } from '@uuxxx/fsm-react';
import { historyPlugin } from '@uuxxx/fsm-plugins/history';

function App() {
	const fsm = useFsm({
		init: 'a',
		states: ['a', 'b', 'c'],
		transitions: {
			goto: { from: '*', to: (s: 'a' | 'b' | 'c') => s },
		},
		plugins: [historyPlugin()],
	});

	return (
		<div>
			<p>State: {fsm.state}</p>
			<button onClick={() => fsm.goto('b')}>Go to B</button>
			<button disabled={!fsm.history.canBack()} onClick={() => fsm.goto(fsm.history.back(1))}>
				Back
			</button>
			<button disabled={!fsm.history.canForward()} onClick={() => fsm.goto(fsm.history.forward(1))}>
				Forward
			</button>
			<p>History: {fsm.history.get().join(' -> ')}</p>
		</div>
	);
}
```

## Exports

```ts
import { useFsm, makeFsm } from '@uuxxx/fsm-react';
import type { FsmConfig, FsmTransition, FsmPlugin, FsmLabel } from '@uuxxx/fsm-react';
```

| Export          | Description                                    |
| --------------- | ---------------------------------------------- |
| `useFsm`        | React hook — reactive FSM                      |
| `makeFsm`       | Re-export from `@uuxxx/fsm` — non-reactive FSM |
| `FsmConfig`     | Config type                                    |
| `FsmTransition` | Transition definition type                     |
| `FsmPlugin`     | Plugin type                                    |
| `FsmLabel`      | State label type (`string`)                    |

## License

[MIT](./LICENSE)
