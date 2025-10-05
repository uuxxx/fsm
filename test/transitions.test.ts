import type {Rec} from '../lib/utils';
import {makeFsm} from '../lib';
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
		fsm['a -> b']();
		expect(fsm.state()).toBe('b');
	});

	test('b -> a', () => {
		const fsm = makeFsm({
			...CONFIG,
			init: 'b',
		});

		fsm['b -> a']();
		expect(fsm.state()).toBe('a');
	});

	test('goto', () => {
		const fsm = makeFsm(CONFIG);
		fsm.goto('d');
		expect(fsm.state()).toBe('d');
	});

	test('[b, c, d] -> a', () => {
		for (const init of ['b', 'c', 'd']) {
			const fsm = makeFsm({
				...CONFIG,
				init,
			});

			fsm['[b, c, d] -> a']();
			expect(fsm.state()).toBe('a');
		}
	});

	test('invalid', () => {
		const fsm = makeFsm(CONFIG);
		expect(() => fsm['b -> a']()).toThrow();
	});
});
