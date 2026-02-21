import {noop, type Rec} from '../lib/utils';
import type {Transition} from '../lib/types/Transition';
import type {Config} from '../lib/types/Config';
import {makeFsm} from '../lib';

type State = 'a' | 'b';

const TRANSITIONS = {
	'a -> b': {
		from: 'a',
		to: 'b',
	},
	'b -> a': {
		from: 'b',
		to: 'a',
	},
	'async goto': {
		from: '*',
		to(state: State) {
			return Promise.resolve(state);
		},
	},
} satisfies Rec<Transition<State>>;

const INIT: State = 'a';

const STATES: State[] = ['a', 'b'];

const CONFIG: Config<State, typeof TRANSITIONS> = {
	init: INIT,
	states: STATES,
	transitions: TRANSITIONS,
};

describe('error-handling', () => {
	describe('pending transition', () => {
		test('throw error, if there\'s pending transition', () => {
			const fsm = makeFsm(CONFIG);
			fsm['async goto']('b').catch(noop);

			expect(fsm['a -> b']).toThrowErrorMatchingInlineSnapshot('"[FSM]: Transition: a -> b can\'t be made. Has pending transtion: async goto"');
		});
	});

	describe('invalid transition', () => {
		test('current state doesn\'t match transition.from', () => {
			const fsm = makeFsm(CONFIG);

			expect(fsm['b -> a']).toThrowErrorMatchingInlineSnapshot('"[FSM]: Transition: b -> a is forbidden"');
		});
	});
});
