import { noop, type Rec } from '@uuxxx/utils';
import { makeFsm } from '../lib/core/fsm';
import type { Config } from '../lib/types/Config';
import type { Transition } from '../lib/types/Transition';

type State = 'a' | 'b' | 'c' | 'd';

const TRANSITIONS = {
	'a -> b': {
		from: 'a',
		to: 'b',
	},
	'b -> a': {
		from: 'b',
		to: 'a',
	},
	'[b, c, d] -> a': {
		from: ['b', 'c', 'd'],
		to: 'a',
	},
	goto: {
		from: '*',
		to(state: State) {
			return state;
		},
	},
	'async goto': {
		from: '*',
		to(state: State) {
			return Promise.resolve(state);
		},
	},
} satisfies Rec<Transition<State>>;

const INIT: State = 'a';

const STATES: State[] = ['a', 'b', 'c', 'd'];

const CONFIG: Config<State, typeof TRANSITIONS> = {
	init: INIT,
	states: STATES,
	transitions: TRANSITIONS,
};

describe('transitions', () => {
	describe('common scenarios', () => {
		it('set valid init state', () => {
			expect(makeFsm(CONFIG).state()).toBe('a');
		});

		it("add init state to states if init state isn't in states", () => {
			// @ts-expect-error for testing
			const fsm = makeFsm({ ...CONFIG, init: 'e' });
			expect(fsm.allStates().includes('e' as State)).toBeTruthy();
		});

		it('a -> b', () => {
			const fsm = makeFsm(CONFIG);
			const state = fsm['a -> b']();
			expect(fsm.state()).toBe('b');
			expect(state).toBe('b');
		});

		it('b -> a', () => {
			const fsm = makeFsm({
				...CONFIG,
				init: 'b',
			});

			const state = fsm['b -> a']();
			expect(fsm.state()).toBe('a');
			expect(state).toBe('a');
		});

		it('goto', () => {
			const fsm = makeFsm(CONFIG);
			const state = fsm.goto('d');
			expect(fsm.state()).toBe('d');
			expect(state).toBe('d');
		});

		it('async goto', async () => {
			const fsm = makeFsm(CONFIG);
			const state = await fsm['async goto']('b');
			expect(state).toBe('b');
			expect(fsm.state()).toBe('b');
		});

		it('[b, c, d] -> a', () => {
			for (const init of ['b', 'c', 'd'] as const) {
				const fsm = makeFsm({
					...CONFIG,
					init,
				});

				const state = fsm['[b, c, d] -> a']();
				expect(fsm.state()).toBe('a');
				expect(state).toBe('a');
			}
		});
	});

	describe('errors', () => {
		it('has pending transition', () => {
			const fsm = makeFsm(CONFIG);
			fsm['async goto']('b').catch(noop);
			expect(fsm['a -> b']).toThrowErrorMatchingInlineSnapshot('[Error: [FSM]: Transition: "a -> b" can\'t be made. Has pending transtion: "async goto"]');
		});

		it("current state doesn't match transition.from", () => {
			const fsm = makeFsm(CONFIG);
			expect(fsm['b -> a']).toThrowErrorMatchingInlineSnapshot('[Error: [FSM]: Transition: "b -> a" is forbidden]');
		});

		it('invalid transition.to sync', () => {
			const fsm = makeFsm(CONFIG);
			expect(() =>
				// @ts-expect-error for testing
				fsm.goto('some invalid state'),
			).toThrowErrorMatchingInlineSnapshot('[Error: [FSM]: Transition: "goto" can\'t be executed. It has invalid "to": "some invalid state"]');
			expect(fsm.state()).toBe('a');
		});

		it('invalid transition.to async', async () => {
			const fsm = makeFsm(CONFIG);
			await expect(() =>
				// @ts-expect-error for testing
				fsm['async goto']('some invalid state'),
			).rejects.toThrowErrorMatchingInlineSnapshot('[Error: [FSM]: Transition: "async goto" can\'t be executed. It has invalid "to": "some invalid state"]');
			expect(fsm.state()).toBe('a');
		});
	});

	describe('onError config', () => {
		it('errors do not throw when onError is provided', () => {
			const onError = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onError } });
			expect(() => fsm['b -> a']()).not.toThrow();
			expect(onError).toHaveBeenCalledWith('Transition: "b -> a" is forbidden');
		});

		it('FSM state remains unchanged after handled error', () => {
			const onError = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onError } });
			fsm['b -> a']();
			expect(fsm.state()).toBe('a');
		});

		it('onError receives lifecycle for invalid "to" (sync)', () => {
			const onError = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onError } });
			// @ts-expect-error for testing
			fsm.goto('invalid');
			expect(onError).toHaveBeenCalledWith('Transition: "goto" can\'t be executed. It has invalid "to": "invalid"', { transition: 'goto', from: 'a', to: 'invalid', args: ['invalid'] });
		});

		it('onError receives lifecycle for invalid "to" (async)', async () => {
			const onError = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onError } });
			// @ts-expect-error for testing
			await fsm['async goto']('invalid');
			expect(onError).toHaveBeenCalledWith('Transition: "async goto" can\'t be executed. It has invalid "to": "invalid"', { transition: 'async goto', from: 'a', to: 'invalid', args: ['invalid'] });
		});

		it('onError does not receive lifecycle for forbidden transition', () => {
			const onError = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onError } });
			fsm['b -> a']();
			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError.mock.calls[0]).toHaveLength(1);
		});

		it('onError does not receive lifecycle for pending transition', () => {
			const onError = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onError } });
			fsm['async goto']('b').catch(noop);
			fsm['a -> b']();
			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError.mock.calls[0]).toHaveLength(1);
		});
	});

	describe('onWarn config', () => {
		it('onWarn is called on circular transition', () => {
			const onWarn = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onWarn } });
			fsm.goto('a');
			expect(onWarn).toHaveBeenCalledTimes(1);
		});

		it('onWarn receives message and lifecycle', () => {
			const onWarn = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onWarn } });
			fsm.goto('a');
			expect(onWarn.mock.calls[0][0]).toContain('circular');
			expect(onWarn.mock.calls[0][1]).toEqual({
				transition: 'goto',
				from: 'a',
				to: 'a',
				args: ['a'],
			});
		});

		it('state remains unchanged after circular transition', () => {
			const onWarn = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onWarn } });
			fsm.goto('a');
			expect(fsm.state()).toBe('a');
		});

		it('onWarn is not called on valid transition', () => {
			const onWarn = vitest.fn();
			const fsm = makeFsm({ ...CONFIG, methods: { onWarn } });
			fsm.goto('b');
			expect(onWarn).not.toHaveBeenCalled();
		});
	});
});
