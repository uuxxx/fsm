# @uuxxx/fsm

[![npm version](https://badge.fury.io/js/@uuxxx%2Ffsm.svg)](https://badge.fury.io/js/@uuxxx%2Ffsm)

A lightweight, type-safe finite state machine library for TypeScript with plugin support, lifecycle hooks, and full type inference.

## Features

- **Full type inference** — transition methods, states, and plugin APIs are auto-generated from config
- **Multiple transition types** — static, dynamic, async, wildcard (`*`), and multi-source
- **Lifecycle hooks** — `onBeforeTransition` (with veto) and `onAfterTransition`
- **Plugin system** — extend your FSM with custom APIs
- **Custom error handling** — provide an `onError` callback or let errors throw
- **Zero dependencies** aside from `@uuxxx/utils`

## Installation

```bash
npm install @uuxxx/fsm
# or
pnpm add @uuxxx/fsm
# or
yarn add @uuxxx/fsm
```

## Quick Start

```typescript
import { makeFsm } from '@uuxxx/fsm';

type State = 'idle' | 'loading' | 'success' | 'error';

const fsm = makeFsm({
	init: 'idle',
	states: ['idle', 'loading', 'success', 'error'],
	transitions: {
		start: {
			from: 'idle',
			to: 'loading',
		},
		succeed: {
			from: 'loading',
			to: 'success',
		},
		fail: {
			from: 'loading',
			to: 'error',
		},
		reset: {
			from: ['success', 'error'],
			to: 'idle',
		},
		goto: {
			from: '*',
			to: (state: State) => state,
		},
	},
});

fsm.state(); // 'idle'
fsm.start(); // 'loading'
fsm.succeed(); // 'success'
fsm.reset(); // 'idle'
fsm.goto('error'); // 'error'
```

Each transition key becomes a method on the FSM instance with the correct type signature inferred from config.

## API Reference

### `makeFsm(config)`

Creates a new finite state machine instance.

#### Config

| Property      | Type                                          | Required | Description                                                                   |
| ------------- | --------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| `init`        | `TState`                                      | Yes      | Initial state                                                                 |
| `states`      | `TState[]`                                    | Yes      | All valid states                                                              |
| `transitions` | `Record<string, Transition<TState>>`          | Yes      | Transition definitions (keys become methods)                                  |
| `methods`     | `{ onBeforeTransition?, onAfterTransition? }` | No       | Lifecycle hooks                                                               |
| `plugins`     | `Plugin[]`                                    | No       | Array of plugins                                                              |
| `onError`     | `(msg: string) => void`                       | No       | Custom error handler. By default, errors throw `Error` with a `[FSM]:` prefix |

#### Returns

An FSM instance combining:

- **State methods** — `state()`, `allStates()`
- **Transition methods** — one per key in `transitions`
- **Plugin APIs** — one namespace per plugin

### State Methods

#### `fsm.state()`

Returns the current state.

#### `fsm.allStates()`

Returns an array of all valid states.

### Transitions

Transitions are defined as objects with `from` and `to` properties:

```typescript
type Transition<TState> = {
	from: '*' | TState | TState[];
	to: TState | ((...args: any[]) => TState | Promise<TState>);
};
```

#### `from` — source state(s)

| Form            | Example                | Description           |
| --------------- | ---------------------- | --------------------- |
| Single state    | `'idle'`               | Only from this state  |
| Multiple states | `['loading', 'error']` | From any listed state |
| Wildcard        | `'*'`                  | From any state        |

#### `to` — target state

| Form    | Example                           | Description                      |
| ------- | --------------------------------- | -------------------------------- |
| Static  | `'loading'`                       | Always transitions to this state |
| Dynamic | `(id: string) => \`user\_${id}\`` | Compute target from arguments    |
| Async   | `async () => await fetchState()`  | Returns `Promise<TState>`        |

#### Transition behavior

- **Circular transitions are skipped** — if `from === to`, the transition is silently canceled with a warning.
- **Concurrent async transitions are blocked** — starting a new transition while an async one is pending triggers an error.
- **Invalid target states** — transitioning to a state not in `states` triggers an error.
- **Forbidden transitions** — calling a transition from a state not matching `from` triggers an error.
- **Return value** — every transition method returns the new state (or `Promise<TState>` for async transitions).

#### Examples

```typescript
const transitions = {
	// Static transition
	start: {
		from: 'idle',
		to: 'loading',
	},

	// Multiple source states
	reset: {
		from: ['success', 'error'],
		to: 'idle',
	},

	// Wildcard (from any state)
	goto: {
		from: '*',
		to: (target: State) => target,
	},

	// Async transition
	fetch: {
		from: 'idle',
		to: async () => {
			const result = await fetchData();
			return result.ok ? 'success' : 'error';
		},
	},
};
```

### Error Handling

By default, the FSM throws on errors (forbidden transitions, invalid states, concurrent transitions). You can provide a custom `onError` handler to change this behavior:

```typescript
const fsm = makeFsm({
	init: 'idle',
	states: ['idle', 'loading'],
	transitions: {
		start: { from: 'idle', to: 'loading' },
		stop: { from: 'loading', to: 'idle' },
	},
	onError: (msg) => {
		console.warn(msg); // Handle gracefully instead of throwing
	},
});

// Won't throw — calls onError instead
fsm.stop(); // "idle" → "idle" via "stop" is forbidden (from doesn't match)
```

When `onError` is provided, the FSM state remains unchanged after an error.

### Lifecycle Methods

Lifecycle methods hook into the transition process:

```typescript
const fsm = makeFsm({
	// ...
	methods: {
		onBeforeTransition: (event) => {
			console.log(`${event.from} → ${event.to} via ${event.transition}`);
			return false; // Return false to cancel the transition
		},
		onAfterTransition: (event) => {
			console.log('Transition complete:', event.transition);
		},
	},
});
```

#### Lifecycle event object

| Property     | Type                 | Description                             |
| ------------ | -------------------- | --------------------------------------- |
| `transition` | `string`             | Name of the transition (the config key) |
| `from`       | `TState`             | State before the transition             |
| `to`         | `TState`             | Target state                            |
| `args`       | `any[] \| undefined` | Arguments passed to dynamic transitions |

#### `onBeforeTransition(event)`

Called before a transition. Return `false` to veto (cancel) the transition.

#### `onAfterTransition(event)`

Called after a successful transition. The FSM state is already updated at this point.

## Plugins

Plugins extend the FSM with additional methods, grouped under a namespace.

### Plugin API

Each plugin receives an `api` object with:

| Method                             | Description                                                       |
| ---------------------------------- | ----------------------------------------------------------------- |
| `api.state()`                      | Get current state                                                 |
| `api.allStates()`                  | Get all valid states                                              |
| `api.init(callback)`               | Run callback when FSM is created (receives initial state)         |
| `api.onBeforeTransition(callback)` | Register before-transition listener. Returns unsubscribe function |
| `api.onAfterTransition(callback)`  | Register after-transition listener. Returns unsubscribe function  |
| `api.onError(callback)`            | Register error listener. Returns unsubscribe function             |

### Creating a Plugin

```typescript
import type { FsmLabel, FsmPlugin, FsmTransition } from '@uuxxx/fsm';

export const myPlugin = <TState extends FsmLabel, TTransitions extends Record<string, FsmTransition<TState>>>() =>
	((api) => {
		let count = 0;

		api.onAfterTransition(() => {
			count++;
		});

		return {
			name: 'counter' as const,
			api: {
				getCount: () => count,
			},
		};
	}) satisfies FsmPlugin<TState, TTransitions>;
```

### Using Plugins

```typescript
const fsm = makeFsm({
	// ...
	plugins: [myPlugin()],
});

fsm.start();
fsm.counter.getCount(); // 1
```

Plugin names must be unique — registering two plugins with the same name triggers an error.

## Built-in Plugins

### History Plugin

Read-only state history tracking with pointer-based navigation.

`back()` and `forward()` move an internal pointer and return the state at that position — they do **not** change the FSM state. Use transition methods to actually navigate (e.g. `fsm.goto(fsm.history.back(1))`).

```typescript
import { makeFsm } from '@uuxxx/fsm';
import { fsmHistoryPlugin } from '@uuxxx/fsm-plugins';

const fsm = makeFsm({
	init: 'a',
	states: ['a', 'b', 'c'],
	transitions: {
		goto: { from: '*', to: (s: 'a' | 'b' | 'c') => s },
	},
	plugins: [fsmHistoryPlugin()],
});

fsm.goto('b');
fsm.goto('c');
fsm.history.get(); // ['a', 'b', 'c'] (returns a copy)

fsm.history.back(1); // returns 'b' (pointer moved, FSM state unchanged)
fsm.history.current(); // 'b'
fsm.history.canBack(); // true
fsm.history.canForward(); // true
fsm.history.forward(1); // returns 'c'
fsm.goto(fsm.history.current()); // actually transition to 'c'
```

#### History API

| Method                       | Returns    | Description                                                                                                     |
| ---------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `fsm.history.get()`          | `TState[]` | Returns a copy of the full history array                                                                        |
| `fsm.history.current()`      | `TState`   | Returns the state at the current pointer position                                                               |
| `fsm.history.back(steps)`    | `TState`   | Move pointer back by `steps`, returns the state at that position. Clamps to start. Ignores non-positive values  |
| `fsm.history.forward(steps)` | `TState`   | Move pointer forward by `steps`, returns the state at that position. Clamps to end. Ignores non-positive values |
| `fsm.history.canBack()`      | `boolean`  | Whether the pointer can move back (pointer > 0)                                                                 |
| `fsm.history.canForward()`   | `boolean`  | Whether the pointer can move forward (pointer < end)                                                            |

When a transition occurs, any forward history after the current pointer is discarded (like browser navigation).

## Exported Types

The library exports the following types for use in plugins and generic code:

```typescript
import type {
	FsmConfig, // Config<TState, TTransitions, TPlugins>
	FsmTransition, // Transition<TState>
	FsmPlugin, // Plugin<TState, TTransitions>
	FsmLabel, // string (state label type)
} from '@uuxxx/fsm';
```

## TypeScript Support

The library is built with TypeScript-first design. All types are inferred from config — no manual type annotations needed:

```typescript
const fsm = makeFsm({
	init: 'idle',
	states: ['idle', 'running', 'stopped'],
	transitions: {
		start: { from: 'idle', to: 'running' },
		stop: { from: 'running', to: 'stopped' },
	},
});

fsm.start(); // ✓ typed — only callable from 'idle'
fsm.stop(); // ✓ typed — only callable from 'running'
fsm.state(); // ✓ returns 'idle' | 'running' | 'stopped'
```

## License

[MIT](./LICENSE)
