# @uuxxx/fsm-plugins

Official plugins for [@uuxxx/fsm](https://github.com/uuxxx/fsm).

Plugins can be imported from the main entry point or individually via sub-path exports:

```ts
// all plugins
import { historyPlugin, loggerPlugin } from '@uuxxx/fsm-plugins';

// individual imports (tree-shakeable)
import { historyPlugin } from '@uuxxx/fsm-plugins/history';
import { loggerPlugin } from '@uuxxx/fsm-plugins/logger';
```

## History Plugin

Read-only state history tracking with pointer-based back/forward navigation.

`back()` and `forward()` move an internal pointer and return the state at that position — they do **not** change the FSM state. Use transition methods to actually navigate (e.g. `fsm.goto(fsm.history.back(1))`).

```ts
import { makeFsm } from '@uuxxx/fsm';
import { historyPlugin } from '@uuxxx/fsm-plugins/history';

const fsm = makeFsm({
	init: 'a',
	states: ['a', 'b', 'c'],
	transitions: { goto: { from: '*', to: (s: 'a' | 'b' | 'c') => s } },
	plugins: [historyPlugin()],
});

fsm.goto('b');
fsm.goto('c');
fsm.history.get(); // ['a', 'b', 'c']
fsm.history.back(1); // 'b' (pointer moved, FSM state unchanged)
fsm.history.canBack(); // true
fsm.history.current(); // 'b'
fsm.goto(fsm.history.current()); // actually transition to 'b'
```

## Logger Plugin

Logs FSM events (init, transitions, errors) for debugging. Uses colorized console output with emojis by default, or accepts a custom handler.

```ts
import { makeFsm } from '@uuxxx/fsm';
import { loggerPlugin } from '@uuxxx/fsm-plugins/logger';

const fsm = makeFsm({
	init: 'idle',
	states: ['idle', 'loading', 'done'],
	transitions: { fetch: { from: 'idle', to: 'loading' } },
	plugins: [loggerPlugin()],
});

// Console: 🚀 [FSM] init → "idle"

fsm.fetch();
// Console: ⚡ [FSM] "idle" → "loading" (via fetch)

fsm.logger.disable(); // pause logging
fsm.logger.enabled(); // false
fsm.logger.enable(); // resume logging
```

### Custom handler

```ts
const fsm = makeFsm({
	// ...
	plugins: [
		loggerPlugin({
			handler: (entry) => {
				// entry: { event: 'init' | 'transition' | 'error', timestamp, ... }
				myLogger.log(entry);
			},
		}),
	],
});
```
