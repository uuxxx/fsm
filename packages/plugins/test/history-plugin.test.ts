import { tap, type Rec } from '@uuxxx/utils';
import { makeFsm, type FsmConfig as Config, type FsmTransition as Transition, type FsmPlugin as Plugin } from '@uuxxx/fsm';
import { historyPlugin } from '../lib/history';

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
} satisfies Config<State, typeof TRANSITIONS, Array<Plugin<State, typeof TRANSITIONS>>>;

describe('history-plugin', () => {
	it('common scenario', () => {
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

	it('get() returns a copy, not a mutable reference', () => {
		const fsm = makeFsm(CONFIG);
		const copy = fsm.history.get();
		copy.push('google.com');
		expect(fsm.history.get()).toEqual(['leetcode.com']);
	});

	it('current() returns state at pointer position', () => {
		const fsm = makeFsm(CONFIG);
		expect(fsm.history.current()).toEqual('leetcode.com');
		fsm.goto('google.com');
		fsm.goto('facebook.com');
		expect(fsm.history.current()).toEqual('facebook.com');
		fsm.history.back(1);
		expect(fsm.history.current()).toEqual('google.com');
		fsm.history.forward(1);
		expect(fsm.history.current()).toEqual('facebook.com');
	});

	it('canBack() and canForward()', () => {
		const fsm = makeFsm(CONFIG);
		expect(fsm.history.canBack()).toBe(false);
		expect(fsm.history.canForward()).toBe(false);

		fsm.goto('google.com');
		expect(fsm.history.canBack()).toBe(true);
		expect(fsm.history.canForward()).toBe(false);

		fsm.goto('facebook.com');
		expect(fsm.history.canBack()).toBe(true);

		fsm.history.back(1);
		expect(fsm.history.canBack()).toBe(true);
		expect(fsm.history.canForward()).toBe(true);

		fsm.history.back(1);
		expect(fsm.history.canBack()).toBe(false);
		expect(fsm.history.canForward()).toBe(true);
	});

	it('back/forward with zero steps does not move pointer', () => {
		const fsm = makeFsm(CONFIG);
		fsm.goto('google.com');
		fsm.goto('facebook.com');

		expect(fsm.history.back(0)).toEqual('facebook.com');
		expect(fsm.history.current()).toEqual('facebook.com');

		fsm.history.back(1);
		expect(fsm.history.forward(0)).toEqual('google.com');
		expect(fsm.history.current()).toEqual('google.com');
	});

	it('back/forward with negative steps does not move pointer', () => {
		const fsm = makeFsm(CONFIG);
		fsm.goto('google.com');
		fsm.goto('facebook.com');

		expect(fsm.history.back(-5)).toEqual('facebook.com');
		expect(fsm.history.current()).toEqual('facebook.com');

		fsm.history.back(2);
		expect(fsm.history.forward(-3)).toEqual('leetcode.com');
		expect(fsm.history.current()).toEqual('leetcode.com');
	});
});
