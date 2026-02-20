import type {Rec} from '../lib/utils';
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

const testPlugin = (() => api => {
	api.methods.unsafe__goto('b');

	return {
		name: 'history' as const,
		methods: {
			show: (): State[] => STATES,
		},
	};
}) satisfies (n: number) => Plugin<State, typeof TRANSITIONS>;

const CONFIG: Config<State, typeof TRANSITIONS, Array<ReturnType<typeof testPlugin>>> = {
	init: INIT,
	states: STATES,
	transitions: TRANSITIONS,
	plugins: [testPlugin()],
};

// not-implemented yet, just a placeholder for future tests
describe.skip('plugins', () => {
	test('throws on >= 2 plugins registered with the same name', () => {
		const fsm = makeFsm(CONFIG);
		fsm.history.show();
	});
});
