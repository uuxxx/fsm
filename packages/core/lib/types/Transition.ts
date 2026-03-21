import type { Label } from './Label';

/**
 * Defines a single state transition.
 *
 * - `from` — source state(s): a single state, an array of states, or `'*'` for any state.
 * - `to` — target: a static state, a function returning a state, or an async function returning `Promise<TState>`.
 */
export type Transition<TState extends Label> = {
	from: '*' | TState | TState[];
	to: TState | ((...args: any[]) => TState | Promise<TState>);
};
