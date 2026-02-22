
import {tap, type Rec} from '../lib/utils';
import {makeFsm} from '../lib/core/fsm';
import type {Config} from '../lib/types/Config';
import type {Transition} from '../lib/types/Transition';
import {historyPlugin} from '../lib/plugins/history';
import {type Plugin} from 'lib/types/Plugin';

type State = 'leetcode.com' | 'google.com' | 'facebook.com' | 'youtube.com' | 'linkedin.com';

const TRANSITIONS = {
	goto: {
		from: '*',
		to: tap<State>,
	},
} satisfies Rec<Transition<State>>;

const INIT: State = 'leetcode.com';

const STATES: State[] = ['leetcode.com', 'google.com', 'facebook.com', 'youtube.com', 'linkedin.com'];

const CONFIG = {
	init: INIT,
	states: STATES,
	transitions: TRANSITIONS,
	plugins: [historyPlugin()],
} satisfies Config<
	State,
	typeof TRANSITIONS,
	Array<Plugin<State, typeof TRANSITIONS>>
>;

describe('history-plugin', () => {
	test('scenario #1', () => {
		const fsm = makeFsm(CONFIG);
		expect(fsm.history.get()).toEqual(['leetcode.com']);
		fsm.goto('google.com');
		fsm.goto('facebook.com');
		fsm.goto('youtube.com');
		expect(fsm.history.get()).toEqual(['leetcode.com', 'google.com', 'facebook.com', 'youtube.com']);
		expect(fsm.history.back(1)).toEqual('facebook.com');
		expect(fsm.history.back(1)).toEqual('google.com');
		expect(fsm.history.forward(1)).toEqual('facebook.com');
		fsm.goto('linkedin.com');
		expect(fsm.history.get()).toEqual(['leetcode.com', 'google.com', 'facebook.com', 'linkedin.com']);
		expect(fsm.history.forward(2)).toEqual('linkedin.com');
		expect(fsm.history.back(2)).toEqual('google.com');
		expect(fsm.history.back(7)).toEqual('leetcode.com');
	});
});
