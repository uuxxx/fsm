import {type Rec} from '../lib/utils';
import {makeFsm} from '../lib';
import type {Config} from '../lib/types/Config';
import type {Transition} from '../lib/types/Transition';
import type {Plugin} from '../lib/types/Plugin';

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
	init: jest.fn(),
	onBeforeTransition: jest.fn(),
	onAfterTransition: jest.fn(),
} as const;

const testPlugin = ((mocks = MOCK_FN) => api => {
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

const CONFIG: Config<
	State,
  typeof TRANSITIONS,
  Array<ReturnType<typeof testPlugin>>
> = {
	init: INIT,
	states: STATES,
	transitions: TRANSITIONS,
	plugins: [testPlugin()],
};

describe('plugins', () => {
	beforeEach(() => {
		Object.values(MOCK_FN).forEach(mock => mock.mockClear());
	});

	test('throws on >= 2 plugins registered with the same name', () => {
		expect(() =>
			makeFsm({...CONFIG, plugins: [testPlugin(), testPlugin()]})).toThrowErrorMatchingInlineSnapshot('"[FSM]: There are at least two plugins with the same name: test-plugin"');
	});

	test('plugin user api is available and working', () => {
		const fsm = makeFsm(CONFIG);
		expect(fsm['test-plugin'].show()).toEqual(STATES);
	});

	describe('plugin api', () => {
		test('init method is called', () => {
			makeFsm(CONFIG);
			expect(MOCK_FN.init.mock.calls).toHaveLength(1);
			expect(MOCK_FN.init.mock.calls[0][0]).toEqual(CONFIG.init);
		});

		test('onBeforeTransition is called', () => {
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

		test('onBeforeTransition cancel transition', () => {
			const onBeforeTransition = jest.fn(_lifecycle => false);

			const fsm = makeFsm({
				...CONFIG,
				plugins: [testPlugin({
					...MOCK_FN,
					onBeforeTransition,
				})],
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

		test('onAfterTransition is called', () => {
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
	});
});
