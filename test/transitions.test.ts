import type {Rec} from '../lib/utils';
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
	test('set valid init state', () => {
		expect(makeFsm(CONFIG).state()).toBe('a');
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
