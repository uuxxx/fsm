import type { Rec } from '@uuxxx/utils';
import type { Label } from '../types/Label';
import type { Plugin } from '../types/Plugin';
import type { Transition } from '../types/Transition';

/**
 * Plugin that tracks state history with pointer-based back/forward navigation.
 *
 * Exposes methods under `fsm.history`:
 * - `get()` — returns the full history array
 * - `back(steps)` — moves the pointer back, returns state at that position
 * - `forward(steps)` — moves the pointer forward, returns state at that position
 *
 * When a new transition occurs, any forward history after the current pointer is discarded.
 *
 * @example
 * ```ts
 * import { makeFsm } from '@uuxxx/fsm';
 * import { fsmHistoryPlugin } from '@uuxxx/fsm/history-plugin';
 *
 * const fsm = makeFsm({
 *   init: 'a',
 *   states: ['a', 'b', 'c'],
 *   transitions: { goto: { from: '*', to: (s: 'a' | 'b' | 'c') => s } },
 *   plugins: [fsmHistoryPlugin()],
 * });
 *
 * fsm.goto('b');
 * fsm.goto('c');
 * fsm.history.get();    // ['a', 'b', 'c']
 * fsm.history.back(1);  // 'b'
 * ```
 */
export const historyPlugin = <TState extends Label, TTransitions extends Rec<Transition<TState>>>() =>
	((api) => {
		const history: TState[] = [];
		let pointer = 0;

		api.init((state) => history.push(state));

		api.onAfterTransition(({ to }) => {
			pointer++;
			history.splice(pointer, history.length - pointer, to);
		});

		return {
			name: 'history' as const,
			api: {
				get(): TState[] {
					return history;
				},
				back(steps: number): TState {
					pointer = Math.max(0, pointer - steps);
					return history[pointer];
				},
				forward(steps: number): TState {
					pointer = Math.min(history.length - 1, pointer + steps);
					return history[pointer];
				},
			},
		};
	}) satisfies Plugin<TState, TTransitions>;
