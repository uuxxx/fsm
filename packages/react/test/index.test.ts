// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { useFsm } from '../src';
import type { FsmTransition } from '@uuxxx/fsm';

type State = 'a' | 'b' | 'c';

const TRANSITIONS = {
	'a -> b': { from: 'a', to: 'b' },
	'b -> c': { from: 'b', to: 'c' },
	goto: { from: '*', to: (state: State) => state },
	asyncGoto: { from: '*', to: (state: State) => Promise.resolve(state) },
} satisfies Record<string, FsmTransition<State>>;

const STATES: State[] = ['a', 'b', 'c'];

describe('useFsm', () => {
	it('should return initial state', () => {
		const { result } = renderHook(() => useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS }));
		expect(result.current.state).toBe('a');
	});

	it('should return all states as a static array', () => {
		const { result } = renderHook(() => useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS }));
		expect(result.current.allStates).toEqual(['a', 'b', 'c']);
	});

	it('should update state after sync transition', () => {
		const { result } = renderHook(() => useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS }));
		act(() => {
			result.current['a -> b']();
		});
		expect(result.current.state).toBe('b');
	});

	it('should update state after dynamic transition', () => {
		const { result } = renderHook(() => useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS }));
		act(() => {
			result.current.goto('c');
		});
		expect(result.current.state).toBe('c');
	});

	it('should update state after async transition', async () => {
		const { result } = renderHook(() => useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS }));
		await act(async () => {
			await result.current.asyncGoto('b');
		});
		expect(result.current.state).toBe('b');
	});

	it('should support lifecycle hooks', () => {
		const log: string[] = [];
		const { result } = renderHook(() =>
			useFsm({
				init: 'a',
				states: STATES,
				transitions: TRANSITIONS,
				methods: {
					onBeforeTransition: ({ from, to }) => {
						log.push(`before:${from}->${to}`);
					},
					onAfterTransition: ({ from, to }) => {
						log.push(`after:${from}->${to}`);
					},
				},
			}),
		);
		act(() => {
			result.current['a -> b']();
		});
		expect(log).toEqual(['before:a->b', 'after:a->b']);
	});

	it('should support onBeforeTransition cancellation', () => {
		const { result } = renderHook(() =>
			useFsm({
				init: 'a',
				states: STATES,
				transitions: TRANSITIONS,
				methods: {
					onBeforeTransition: () => false,
				},
			}),
		);
		act(() => {
			result.current['a -> b']();
		});
		expect(result.current.state).toBe('a');
	});

	it('should track multiple transitions', () => {
		const { result } = renderHook(() => useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS }));
		act(() => {
			result.current['a -> b']();
		});
		expect(result.current.state).toBe('b');
		act(() => {
			result.current['b -> c']();
		});
		expect(result.current.state).toBe('c');
	});

	it('should preserve FSM instance across re-renders', () => {
		const { result, rerender } = renderHook(() => useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS }));
		act(() => {
			result.current['a -> b']();
		});
		expect(result.current.state).toBe('b');
		rerender();
		expect(result.current.state).toBe('b');
	});
});
