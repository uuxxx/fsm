# @uuxxx/fsm-plugins

Official plugins for [@uuxxx/fsm](https://github.com/uuxxx/fsm).

## History Plugin

Read-only state history tracking with pointer-based back/forward navigation.

`back()` and `forward()` move an internal pointer and return the state at that position — they do **not** change the FSM state. Use transition methods to actually navigate (e.g. `fsm.goto(fsm.history.back(1))`).

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
fsm.history.back(1); // 'b' (pointer moved, FSM state unchanged)
fsm.history.canBack(); // true
fsm.history.current(); // 'b'
fsm.goto(fsm.history.current()); // actually transition to 'b'
```
