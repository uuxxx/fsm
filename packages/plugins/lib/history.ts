import type { Rec } from '@uuxxx/utils';
import type { FsmLabel as Label, FsmPlugin as Plugin, FsmTransition as Transition } from '@uuxxx/fsm';

/**
 * Read-only plugin that tracks state history with pointer-based back/forward navigation.
 *
 * **Important:** `back()` and `forward()` do NOT change the FSM state — they only move
 * an internal pointer and return the state at that position. To actually navigate,
 * trigger the appropriate transition yourself (e.g. `fsm.goto(fsm.history.back(1))`).
 *
 * Exposes methods under `fsm.history`:
 * - `get()` — returns a copy of the full history array
 * - `current()` — returns the state at the current pointer position
 * - `back(steps)` — moves the pointer back, returns state at that position
 * - `forward(steps)` — moves the pointer forward, returns state at that position
 * - `canBack()` — whether the pointer can move back
 * - `canForward()` — whether the pointer can move forward
 *
 * When a new transition occurs, any forward history after the current pointer is discarded.
 *
 * @example
 * ```ts
 * import { makeFsm } from '@uuxxx/fsm';
 * import { fsmHistoryPlugin } from '@uuxxx/fsm-plugins';
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
 * fsm.history.get();      // ['a', 'b', 'c']
 * fsm.history.back(1);    // 'b'
 * fsm.history.canBack();  // true
 * fsm.goto(fsm.history.current()); // transition to 'b'
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
					return [...history];
				},
				current(): TState {
					return history[pointer];
				},
				back(steps: number): TState {
					pointer = Math.max(0, pointer - Math.max(0, steps));
					return history[pointer];
				},
				forward(steps: number): TState {
					pointer = Math.min(history.length - 1, pointer + Math.max(0, steps));
					return history[pointer];
				},
				canBack(): boolean {
					return pointer > 0;
				},
				canForward(): boolean {
					return pointer < history.length - 1;
				},
			},
		};
	}) satisfies Plugin<TState, TTransitions>;
