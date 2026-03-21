import { isRef, isReadonly } from 'vue';
import { useFsm } from '../src';
import type { FsmTransition } from '@uuxxx/fsm';
import { tap, type Rec } from '@uuxxx/utils';

type State = 'a' | 'b' | 'c';

const TRANSITIONS = {
	'a -> b': { from: 'a', to: 'b' },
	'b -> c': { from: 'b', to: 'c' },
	goto: { from: '*', to: tap<State> },
	asyncGoto: { from: '*', to: (state: State) => Promise.resolve(state) },
} satisfies Rec<FsmTransition<State>>;

const STATES: State[] = ['a', 'b', 'c'];

describe('useFsm', () => {
	it('should return reactive state ref with initial value', () => {
		const fsm = useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS });
		expect(fsm.state.value).toBe('a');
		expect(isRef(fsm.state)).toBe(true);
	});

	it('should return readonly state ref', () => {
		const fsm = useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS });
		expect(isReadonly(fsm.state)).toBe(true);
	});

	it('should return all states as a static array', () => {
		const fsm = useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS });
		expect(fsm.allStates).toEqual(['a', 'b', 'c']);
	});

	it('should update state ref after sync transition', () => {
		const fsm = useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS });
		fsm['a -> b']();
		expect(fsm.state.value).toBe('b');
	});

	it('should update state ref after dynamic transition', () => {
		const fsm = useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS });
		fsm.goto('c');
		expect(fsm.state.value).toBe('c');
	});

	it('should update state ref after async transition', async () => {
		const fsm = useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS });
		await fsm.asyncGoto('b');
		expect(fsm.state.value).toBe('b');
	});

	it('should support lifecycle hooks', () => {
		const log: string[] = [];
		const fsm = useFsm({
			init: 'a',
			states: STATES,
			transitions: TRANSITIONS,
			methods: {
				onBeforeTransition: ({ from, to }) => {
					log.push(`before:${from}->${to}`);
				},
				onAfterTransition: ({ from, to }) => {
					log.push(`after:${from}->${to}`);
				},
			},
		});
		fsm['a -> b']();
		expect(log).toEqual(['before:a->b', 'after:a->b']);
	});

	it('should support onBeforeTransition cancellation', () => {
		const fsm = useFsm({
			init: 'a',
			states: STATES,
			transitions: TRANSITIONS,
			methods: {
				onBeforeTransition: () => false,
			},
		});
		fsm['a -> b']();
		expect(fsm.state.value).toBe('a');
	});

	it('should track multiple transitions', () => {
		const fsm = useFsm({ init: 'a', states: STATES, transitions: TRANSITIONS });
		fsm['a -> b']();
		expect(fsm.state.value).toBe('b');
		fsm['b -> c']();
		expect(fsm.state.value).toBe('c');
	});
});
