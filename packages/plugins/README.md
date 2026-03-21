# @uuxxx/fsm-plugins

Official plugins for [@uuxxx/fsm](https://github.com/uuxxx/fsm).

## History Plugin

Tracks state history with back/forward navigation.

```ts
import { makeFsm } from '@uuxxx/fsm';
import { fsmHistoryPlugin } from '@uuxxx/fsm-plugins';

const fsm = makeFsm({
	init: 'a',
	states: ['a', 'b', 'c'],
	transitions: { goto: { from: '*', to: (s: 'a' | 'b' | 'c') => s } },
	plugins: [fsmHistoryPlugin()],
});

fsm.goto('b');
fsm.goto('c');
fsm.history.get(); // ['a', 'b', 'c']
fsm.history.back(1); // 'b'
```
