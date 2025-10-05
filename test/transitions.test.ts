import {makeFsm} from '../lib';
import type {Config} from '../lib/types/Config';
import type {Transition as TransitionLib} from '../lib/types/Transition';

type State = 'a' | 'b' | 'c' | 'd';

type Transition = 'a -> b' | 'b -> a' | 'goto';

const TRANSITIONS = [
	{
		name: 'a -> b',
		from: 'a',
		to: 'b',
	},
	{
		name: 'b -> a',
		from: 'b',
		to: 'a',
	},
	{
		name: 'goto',
		from: '*',
		to(state: State) {
			return state;
		},
	},
] satisfies Array<TransitionLib<State, Transition>>;

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

	test('invalid', () => {
		const fsm = makeFsm(CONFIG);
		expect(() => fsm['b -> a']()).toThrow();
	});
});
