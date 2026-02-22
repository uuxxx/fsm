import {tap, type Rec} from '../lib/utils';
import {makeFsm} from '../lib/core/fsm';
import type {Transition} from '../lib/types/Transition';
import type {Config} from '../lib/types/Config';

const onBeforeTransition = jest.fn();
const onBeforeTransitionCancel = jest.fn((..._args: any[]) => false);
const onAfterTransition = jest.fn();

type State = 'a' | 'b' | 'c' | 'd';

const TRANSITIONS = {
	'a -> b': {
		from: 'a',
		to: 'b',
	},
	goto: {
		from: '*',
		to: tap<State>,
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
	methods: {
		onBeforeTransition,
		onAfterTransition,
	},
};

beforeEach(() => {
	onBeforeTransition.mockClear();
	onBeforeTransitionCancel.mockClear();
	onAfterTransition.mockClear();
});

describe('lifecycle', () => {
	describe('onBeforeTransition', () => {
		test('sync transition, no args', () => {
			const fsm = makeFsm(CONFIG);
			fsm['a -> b']();

			expect(fsm.state()).toBe('b');
			expect(onBeforeTransition).toHaveBeenCalledTimes(1);
			expect(onBeforeTransition.mock.calls[0][0]).toEqual({
				transition: 'a -> b',
				from: 'a',
				to: 'b',
			});
		});

		test('sync transition, has args', () => {
			const fsm = makeFsm(CONFIG);
			fsm.goto('b');

			expect(fsm.state()).toBe('b');
			expect(onBeforeTransition).toHaveBeenCalledTimes(1);
			expect(onBeforeTransition.mock.calls[0][0]).toEqual({
				args: ['b'],
				transition: 'goto',
				from: 'a',
				to: 'b',
			});
		});

		test('async transition, has args', async () => {
			const fsm = makeFsm(CONFIG);
			await fsm['async goto']('d');

			expect(fsm.state()).toBe('d');
			expect(onBeforeTransition).toHaveBeenCalledTimes(1);
			expect(onBeforeTransition.mock.calls[0][0]).toEqual({
				args: ['d'],
				transition: 'async goto',
				from: 'a',
				to: 'd',
			});
		});

		test('cancelable transition', async () => {
			const fsm = makeFsm({
				...CONFIG,
				methods: {
					...CONFIG.methods,
					onBeforeTransition: onBeforeTransitionCancel,
				},
			});

			fsm.goto('d');

			expect(fsm.state()).toBe('a');
			expect(onBeforeTransitionCancel).toHaveBeenCalledTimes(1);
			expect(onBeforeTransitionCancel.mock.calls[0][0]).toEqual({
				args: ['d'],
				transition: 'goto',
				from: 'a',
				to: 'd',
			});
		});
	});

	describe('onAfterTransition', () => {
		test('sync transition, no args', () => {
			const fsm = makeFsm(CONFIG);
			fsm['a -> b']();

			expect(fsm.state()).toBe('b');
			expect(onAfterTransition).toHaveBeenCalledTimes(1);
			expect(onAfterTransition.mock.calls[0][0]).toEqual({
				transition: 'a -> b',
				from: 'a',
				to: 'b',
			});
		});

		test('sync transition, has args', () => {
			const fsm = makeFsm(CONFIG);
			fsm.goto('b');

			expect(fsm.state()).toBe('b');
			expect(onAfterTransition).toHaveBeenCalledTimes(1);
			expect(onAfterTransition.mock.calls[0][0]).toEqual({
				args: ['b'],
				transition: 'goto',
				from: 'a',
				to: 'b',
			});
		});

		test('async transition, has args', async () => {
			const fsm = makeFsm(CONFIG);
			await fsm['async goto']('d');

			expect(fsm.state()).toBe('d');
			expect(onAfterTransition).toHaveBeenCalledTimes(1);
			expect(onAfterTransition.mock.calls[0][0]).toEqual({
				args: ['d'],
				transition: 'async goto',
				from: 'a',
				to: 'd',
			});
		});
	});
});
