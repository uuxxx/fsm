import type { Rec } from '@uuxxx/utils';
import { makeFsm } from '../lib/core/fsm';
import type { Config } from '../lib/types/Config';
import type { Transition } from '../lib/types/Transition';

type State = 'idle' | 'loading' | 'success' | 'error';

const transitions = {
	load: {
		from: 'idle',
		to: 'loading',
	},
	resolve: {
		from: 'loading',
		to: 'success',
	},
	reject: {
		from: 'loading',
		to: 'error',
	},
	reset: {
		from: '*',
		to: 'idle',
	},
	goto: {
		from: '*',
		to(state: State) {
			return state;
		},
	},
	asyncGoto: {
		from: '*',
		to(state: State) {
			return Promise.resolve(state);
		},
	},
	multiSource: {
		from: ['success', 'error'] as ['success', 'error'],
		to: 'idle',
	},
} satisfies Rec<Transition<State>>;

type Transitions = typeof transitions;

const config: Config<State, Transitions> = {
	init: 'idle',
	states: ['idle', 'loading', 'success', 'error'],
	transitions,
};

describe('types', () => {
	describe('makeFsm return type', () => {
		it('state() returns the state union', () => {
			const fsm = makeFsm(config);
			expectTypeOf(fsm.state).toEqualTypeOf<() => State>();
		});

		it('allStates() returns array of state union', () => {
			const fsm = makeFsm(config);
			expectTypeOf(fsm.allStates).toEqualTypeOf<() => State[]>();
		});
	});

	describe('static transition methods', () => {
		it('static to returns a no-arg function returning the target literal', () => {
			const fsm = makeFsm(config);
			expectTypeOf(fsm.load).toEqualTypeOf<() => 'loading'>();
			expectTypeOf(fsm.resolve).toEqualTypeOf<() => 'success'>();
			expectTypeOf(fsm.reject).toEqualTypeOf<() => 'error'>();
			expectTypeOf(fsm.reset).toEqualTypeOf<() => 'idle'>();
			expectTypeOf(fsm.multiSource).toEqualTypeOf<() => 'idle'>();
		});

		it('static transition return value is the literal target state', () => {
			const fsm = makeFsm(config);
			const result = fsm.load();
			expectTypeOf(result).toEqualTypeOf<'loading'>();
		});
	});

	describe('dynamic transition methods', () => {
		it('sync dynamic to preserves the function signature', () => {
			const fsm = makeFsm(config);
			expectTypeOf(fsm.goto).toEqualTypeOf<(state: State) => State>();
		});

		it('async dynamic to preserves the function signature', () => {
			const fsm = makeFsm(config);
			expectTypeOf(fsm.asyncGoto).toEqualTypeOf<(state: State) => Promise<State>>();
		});
	});

	describe('transition methods exist as keys', () => {
		it('all transition names are accessible on the fsm instance', () => {
			const fsm = makeFsm(config);
			expectTypeOf(fsm).toHaveProperty('load');
			expectTypeOf(fsm).toHaveProperty('resolve');
			expectTypeOf(fsm).toHaveProperty('reject');
			expectTypeOf(fsm).toHaveProperty('reset');
			expectTypeOf(fsm).toHaveProperty('goto');
			expectTypeOf(fsm).toHaveProperty('asyncGoto');
			expectTypeOf(fsm).toHaveProperty('multiSource');
		});
	});

	describe('config type constraints', () => {
		it('init must be a valid state', () => {
			makeFsm<State, Transitions, []>({
				// @ts-expect-error init must be a valid State
				init: 'invalid',
				states: ['idle', 'loading', 'success', 'error'],
				transitions,
			});
		});

		it('transition from must reference valid states', () => {
			const badTransitions = {
				bad: {
					// @ts-expect-error 'nonexistent' is not a valid State
					from: 'nonexistent',
					to: 'idle',
				},
			} satisfies Rec<Transition<State>>;

			void badTransitions;
		});

		it('transition to must reference valid states', () => {
			const badTransitions = {
				bad: {
					from: 'idle',
					// @ts-expect-error 'nonexistent' is not a valid State
					to: 'nonexistent',
				},
			} satisfies Rec<Transition<State>>;

			void badTransitions;
		});

		it('transition from array must contain valid states', () => {
			const badTransitions = {
				bad: {
					// @ts-expect-error 'nonexistent' is not a valid State
					from: ['idle', 'nonexistent'],
					to: 'loading',
				},
			} satisfies Rec<Transition<State>>;

			void badTransitions;
		});
	});

	describe('lifecycle methods typing', () => {
		it('onBeforeTransition receives typed lifecycle', () => {
			makeFsm({
				...config,
				methods: {
					onBeforeTransition(lifecycle) {
						expectTypeOf(lifecycle.from).toEqualTypeOf<State>();
						expectTypeOf(lifecycle.to).toEqualTypeOf<State>();
						expectTypeOf(lifecycle.transition).toEqualTypeOf<keyof Transitions>();
					},
				},
			});
		});

		it('onAfterTransition receives typed lifecycle', () => {
			makeFsm({
				...config,
				methods: {
					onAfterTransition(lifecycle) {
						expectTypeOf(lifecycle.from).toEqualTypeOf<State>();
						expectTypeOf(lifecycle.to).toEqualTypeOf<State>();
						expectTypeOf(lifecycle.transition).toEqualTypeOf<keyof Transitions>();
					},
				},
			});
		});

		it('onBeforeTransition can return boolean or void', () => {
			makeFsm({
				...config,
				methods: {
					onBeforeTransition() {
						return true;
					},
				},
			});

			makeFsm({
				...config,
				methods: {
					onBeforeTransition() {
						// returning void is also valid
					},
				},
			});
		});
	});

	describe('wildcard and multi-source transitions', () => {
		it('wildcard from accepts any string literal', () => {
			const t: Transition<State> = {
				from: '*',
				to: 'idle',
			};
			expectTypeOf(t.from).toEqualTypeOf<'*' | State | State[]>();
		});

		it('multi-source from accepts array of states', () => {
			const t: Transition<State> = {
				from: ['idle', 'loading'],
				to: 'error',
			};
			void t;
		});
	});

	describe('dynamic to function constraints', () => {
		it('dynamic to function must return a valid state or Promise of state', () => {
			const t: Transition<State> = {
				from: '*',
				to(x: number) {
					return x > 0 ? 'success' : 'error';
				},
			};
			void t;
		});

		it('dynamic to async function returns Promise<State>', () => {
			const t: Transition<State> = {
				from: '*',
				to: async (): Promise<State> => 'idle',
			};
			void t;
		});
	});
});
