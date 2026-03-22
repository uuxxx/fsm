import { noop, type Rec, type Ulx } from '@uuxxx/utils';
import { makeFsm } from '../lib/core/fsm';
import type { Config } from '../lib/types/Config';
import type { Transition } from '../lib/types/Transition';
import type { Plugin } from '../lib/types/Plugin';

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
} satisfies Rec<Transition<State>>;

const INIT: State = 'a';

const STATES: State[] = ['a', 'b'];

const MOCK_FN = {
	init: vitest.fn(),
	onBeforeTransition: vitest.fn(),
	onAfterTransition: vitest.fn(),
} as const;

const testPlugin = ((mocks = MOCK_FN) =>
	(api) => {
		api.init(mocks.init);
		api.onBeforeTransition(mocks.onBeforeTransition);
		api.onAfterTransition(mocks.onAfterTransition);

		return {
			name: 'test-plugin' as const,
			api: {
				show: (): State[] => STATES,
			},
		};
	}) satisfies (mocks?: typeof MOCK_FN) => Plugin<State, typeof TRANSITIONS>;

const CONFIG: Config<State, typeof TRANSITIONS, Array<ReturnType<typeof testPlugin>>> = {
	init: INIT,
	states: STATES,
	transitions: TRANSITIONS,
	plugins: [testPlugin()],
};

beforeEach(() => {
	Object.values(MOCK_FN).forEach((mock) => mock.mockClear());
});

describe('plugins', () => {
	it('throws on >= 2 plugins registered with the same name', () => {
		expect(() => makeFsm({ ...CONFIG, plugins: [testPlugin(), testPlugin()] })).toThrowErrorMatchingInlineSnapshot('[Error: [FSM]: There are at least two plugins with the same name: "test-plugin"]');
	});

	it('plugin user api is available and working', () => {
		const fsm = makeFsm(CONFIG);
		expect(fsm['test-plugin'].show()).toEqual(STATES);
	});

	describe('plugin api', () => {
		it('allStates', () => {
			let allStates: Ulx<State[]>;

			makeFsm({
				...CONFIG,
				plugins: [
					(api) => {
						allStates = api.allStates();

						return {
							name: 'test-plugin',
							api: {},
						};
					},
				],
			});

			expect(allStates).toEqual(['a', 'b']);
		});

		it('state', () => {
			const fsm = makeFsm({
				...CONFIG,
				plugins: [
					(api) => ({
						name: 'test-plugin' as const,
						api: {
							state() {
								return api.state();
							},
						},
					}),
				],
			});

			fsm['a -> b']();
			expect(fsm['test-plugin'].state()).toEqual('b');
		});

		it('init method is called', () => {
			makeFsm(CONFIG);
			expect(MOCK_FN.init.mock.calls).toHaveLength(1);
			expect(MOCK_FN.init.mock.calls[0][0]).toEqual(CONFIG.init);
		});

		it('onBeforeTransition is called', () => {
			const fsm = makeFsm(CONFIG);
			fsm['a -> b']();
			expect(MOCK_FN.onBeforeTransition.mock.calls).toHaveLength(1);
			expect(MOCK_FN.onBeforeTransition.mock.calls[0][0]).toEqual({
				transition: 'a -> b',
				from: 'a',
				to: 'b',
			});
			expect(fsm.state()).toBe('b');
		});

		it('onBeforeTransition cancel transition', () => {
			const onBeforeTransition = vitest.fn((_lifecycle) => false);

			const fsm = makeFsm({
				...CONFIG,
				plugins: [
					testPlugin({
						...MOCK_FN,
						onBeforeTransition,
					}),
				],
			});

			fsm['a -> b']();
			expect(onBeforeTransition.mock.calls).toHaveLength(1);
			expect(onBeforeTransition.mock.calls[0][0]).toEqual({
				transition: 'a -> b',
				from: 'a',
				to: 'b',
			});
			expect(fsm.state()).toBe('a');
		});

		it('onAfterTransition is called', () => {
			const fsm = makeFsm(CONFIG);
			fsm['a -> b']();
			expect(MOCK_FN.onAfterTransition.mock.calls).toHaveLength(1);
			expect(MOCK_FN.onAfterTransition.mock.calls[0][0]).toEqual({
				transition: 'a -> b',
				from: 'a',
				to: 'b',
			});
			expect(fsm.state()).toBe('b');
		});

		it('onError listener receives error messages', () => {
			const onErrorMock = vitest.fn();

			const fsm = makeFsm({
				...CONFIG,
				methods: { onError: noop },
				plugins: [
					(api) => {
						api.onError(onErrorMock);

						return {
							name: 'error-plugin' as const,
							api: {},
						};
					},
				],
			});

			fsm['b -> a']();
			expect(onErrorMock).toHaveBeenCalledWith('Transition: "b -> a" is forbidden');
		});

		it('onError unsubscribe works', () => {
			const onErrorMock = vitest.fn();

			let unsubscribe: () => void;

			const fsm = makeFsm({
				...CONFIG,
				methods: { onError: noop },
				plugins: [
					(api) => {
						unsubscribe = api.onError(onErrorMock);

						return {
							name: 'error-plugin' as const,
							api: {},
						};
					},
				],
			});

			fsm['b -> a']();
			expect(onErrorMock).toHaveBeenCalledTimes(1);

			unsubscribe!();
			fsm['b -> a']();
			expect(onErrorMock).toHaveBeenCalledTimes(1);
		});
	});
});
