# @uuxxx/fsm

[![npm version](https://badge.fury.io/js/@uuxxx%2Ffsm.svg)](https://badge.fury.io/js/@uuxxx%2Ffsm)

A lightweight, type-safe finite state machine library for JavaScript/TypeScript with plugin support and lifecycle hooks.

## Features

- 🚀 **Type-safe**: Full TypeScript support with inferred types
- 🔌 **Plugin system**: Extensible with custom plugins
- 🎣 **Lifecycle hooks**: `onBeforeTransition` and `onAfterTransition`
- ⚡ **Async support**: Handle asynchronous transitions
- 🏗️ **Flexible transitions**: Support for single states, multiple states, or wildcard (`*`)
- 🧪 **Well-tested**: Comprehensive test suite

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

const STATES: State[] = ['idle', 'loading', 'success', 'error']

const fsm = makeFsm({
  init: 'idle',
  states: STATES,
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
      to: (state: State) => state
    }
  },
});

// Check current state
console.log(fsm.state()); // 'idle'

// Perform transitions
fsm.start();
console.log(fsm.state()); // 'loading'

fsm.succeed();
console.log(fsm.state()); // 'success'

fsm.reset()
console.log(fsm.state()) // 'idle'

fsm.goto('error')
console.log(fsm.state()) // 'error'
```

## API Reference

### `makeFsm(config)`

Creates a new finite state machine instance.

#### Parameters

- `config`: Configuration object with the following properties:
  - `init`: Initial state
  - `states`: Array of all possible states
  - `transitions`: Object defining state transitions
  - `methods?`: Optional lifecycle methods
  - `plugins?`: Optional array of plugins

#### Returns

An FSM instance with transition methods, state methods, and plugin APIs.

### State Methods

#### `fsm.state()`

Returns the current state.

```typescript
const currentState = fsm.state();
```

#### `fsm.allStates()`

Returns an array of all possible states.

```typescript
const allStates = fsm.allStates();
```

### Transitions

Transitions are defined as objects with `from` and `to` properties:

```typescript
type Transition<TState> = {
  from: '*' | TState | TState[];
  to: TState | ((...args: any[]) => TState | Promise<TState>);
};
```

- `from`: The state(s) this transition can occur from
  - Single state: `'idle'`
  - Multiple states: `['loading', 'error']`
  - Any state: `'*'`
- `to`: The target state or a function returning the target state
  - Static: `'loading'`
  - Dynamic: `(userId: string) => \`user_\${userId}\``
  - Async: `async (data) => await apiCall(data)`

#### Examples

```typescript
const transitions = {
  // Simple transition
  'idle -> loading': {
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
    to: (targetState: State) => targetState,
  },

  // Async transition
  'async fetch': {
    from: 'idle',
    to: async () => {
      const result = await fetchData();
      return result.success ? 'success' : 'error';
    },
  },
};
```

### Lifecycle Methods

Lifecycle methods can be attached to the FSM configuration:

```typescript
const config = {
  // ... other config
  methods: {
    onBeforeTransition: (event) => {
      console.log('About to transition:', event);
      // Return false to cancel the transition
      return true;
    },
    onAfterTransition: (event) => {
      console.log('Transition completed:', event);
    },
  },
};
```

#### `onBeforeTransition(event)`

Called before a transition occurs. Return `false` to cancel the transition.

**Parameters:**
- `event`: Object with `transition`, `from`, `to`, and optional `args`

#### `onAfterTransition(event)`

Called after a successful transition.

**Parameters:**
- `event`: Object with `transition`, `from`, `to`, and optional `args`

## Plugins

Plugins extend the FSM with additional functionality. Each plugin receives an API object and returns a plugin definition.

### Plugin API

Plugins have access to:

- `api.state()`: Get current state
- `api.allStates()`: Get all states
- `api.init(callback)`: Register initialization callback
- `api.onBeforeTransition(callback)`: Register before transition callback
- `api.onAfterTransition(callback)`: Register after transition callback

### Creating a Plugin

```typescript
const myPlugin = (options) => (api) => {
  // Plugin initialization
  api.init((initialState) => {
    console.log('FSM initialized with state:', initialState);
  });

  // Listen to transitions
  api.onBeforeTransition((event) => {
    console.log('Transition starting:', event);
  });

  // Return plugin definition
  return {
    name: 'my-plugin',
    api: {
      // Custom methods exposed on fsm['my-plugin']
      doSomething: () => {
        return api.state();
      },
    },
  };
};
```

### Using Plugins

```typescript
const config = {
  // ... other config
  plugins: [myPlugin({ someOption: true })],
};

const fsm = makeFsm(config);

// Access plugin API
const currentState = fsm['my-plugin'].doSomething();
```

## Built-in Plugins

### History Plugin

Tracks state history and provides navigation methods.

```typescript
import { makeFsm, historyPlugin } from '@uuxxx/fsm';

const config = {
  // ... config
  plugins: [historyPlugin()],
};

const fsm = makeFsm(config);

// Navigate
fsm.goto('state1');
fsm.goto('state2');

// History API
console.log(fsm.history.get()); // ['initial', 'state1', 'state2']

fsm.history.back(1); // Go back 1 step
fsm.history.forward(1); // Go forward 1 step
```

#### History API Methods

- `fsm.history.get()`: Get the full history array
- `fsm.history.back(steps?)`: Go back N steps (default: 1)
- `fsm.history.forward(steps?)`: Go forward N steps (default: 1)

## Error Handling

The FSM throws errors in the following cases:

- Invalid transition (current state doesn't match `from`)
- Pending async transition when starting a new sync transition
- Invalid target state
- Duplicate plugin names

```typescript
try {
  fsm.invalidTransition();
} catch (error) {
  console.error(error.message); // [FSM]: Transition: "invalidTransition" is forbidden
}
```

## TypeScript Support

The library is fully typed. Type inference works automatically:

```typescript
const fsm = makeFsm({
  init: 'idle',
  states: ['idle', 'running', 'stopped'],
  transitions: {
    start: { from: 'idle', to: 'running' },
    stop: { from: 'running', to: 'stopped' },
  },
});
// fsm is fully typed - autocomplete works for transitions and states
```
