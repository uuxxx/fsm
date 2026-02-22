import {noop, type Rec} from '../lib/utils';
import {makeFsm} from '../lib/core/fsm';
import type {Config} from '../lib/types/Config';
import type {Transition} from '../lib/types/Transition';

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
		test('set valid init state', () => {
			expect(makeFsm(CONFIG).state()).toBe('a');
		});

		test('add init state to states if init state isn\'t in states', () => {
			// @ts-expect-error for testing
			expect(makeFsm({...CONFIG, init: 'e'}).allStates().includes('e')).toBeTruthy();
		});

		test('a -> b', () => {
			const fsm = makeFsm(CONFIG);
			const state = fsm['a -> b']();
			expect(fsm.state()).toBe('b');
			expect(state).toBe('b');
		});

		test('b -> a', () => {
			const fsm = makeFsm({
				...CONFIG,
				init: 'b',
			});

			const state = fsm['b -> a']();
			expect(fsm.state()).toBe('a');
			expect(state).toBe('a');
		});

		test('goto', () => {
			const fsm = makeFsm(CONFIG);
			const state = fsm.goto('d');
			expect(fsm.state()).toBe('d');
			expect(state).toBe('d');
		});

		test('async goto', async () => {
			const fsm = makeFsm(CONFIG);
			const state = await fsm['async goto']('b');
			expect(state).toBe('b');
			expect(fsm.state()).toBe('b');
		});

		test('[b, c, d] -> a', () => {
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
		test('has pending transition', () => {
			const fsm = makeFsm(CONFIG);
			fsm['async goto']('b').catch(noop);
			expect(fsm['a -> b']).toThrowErrorMatchingInlineSnapshot('"[FSM]: Transition: "a -> b" can\'t be made. Has pending transtion: "async goto""');
		});

		test('current state doesn\'t match transition.from', () => {
			const fsm = makeFsm(CONFIG);
			expect(fsm['b -> a']).toThrowErrorMatchingInlineSnapshot('"[FSM]: Transition: "b -> a" is forbidden"');
		});

		test('invalid transition.to sync', () => {
			const fsm = makeFsm(CONFIG);
			expect(() =>
			// @ts-expect-error for testing
				fsm.goto('some invalid state')).toThrowErrorMatchingInlineSnapshot('"[FSM]: Transition: "goto" can\'t be executed. It has invalid "to": "some invalid state""');
			expect(fsm.state()).toBe('a');
		});

		test('invalid transition.to async', () => {
			const fsm = makeFsm(CONFIG);
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			expect(() =>
			// @ts-expect-error for testing
				fsm['async goto']('some invalid state')).rejects.toThrowErrorMatchingInlineSnapshot('"[FSM]: Transition: "async goto" can\'t be executed. It has invalid "to": "some invalid state""');
			expect(fsm.state()).toBe('a');
		});
	});
});
