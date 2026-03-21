import { tap, type Rec } from '@uuxxx/utils';
import { makeFsm } from '../lib/core/fsm';
import type { Transition } from '../lib/types/Transition';
import type { Config } from '../lib/types/Config';

const onBeforeTransition = vitest.fn();
const onBeforeTransitionCancel = vitest.fn((..._args: any[]) => false);
const onAfterTransition = vitest.fn();

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
		it('sync transition, no args', () => {
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

		it('sync transition, has args', () => {
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

		it('async transition, has args', async () => {
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

		it('cancelable transition', async () => {
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

		it("isn't called on circular transition", () => {
			const fsm = makeFsm(CONFIG);
			fsm.goto('a');

			expect(fsm.state()).toBe('a');
			expect(onBeforeTransition).not.toHaveBeenCalled();
		});
	});

	describe('onAfterTransition', () => {
		it('sync transition, no args', () => {
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

		it('sync transition, has args', () => {
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

		it('async transition, has args', async () => {
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

		it("isn't called on circular transition", () => {
			const fsm = makeFsm(CONFIG);
			fsm.goto('a');

			expect(fsm.state()).toBe('a');
			expect(onAfterTransition).not.toHaveBeenCalled();
		});
	});
});
