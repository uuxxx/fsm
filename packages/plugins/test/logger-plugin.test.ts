import { tap, type Rec } from '@uuxxx/utils';
import { makeFsm, type FsmTransition } from '@uuxxx/fsm';
import { loggerPlugin, type LogEntry } from '../lib/logger';

type State = 'idle' | 'loading' | 'done' | 'error';

const STATES: State[] = ['idle', 'loading', 'done', 'error'];

const TRANSITIONS = {
	fetch: {
		from: 'idle' as const,
		to: 'loading' as const,
	},
	resolve: {
		from: 'loading' as const,
		to: 'done' as const,
	},
	reject: {
		from: 'loading' as const,
		to: 'error' as const,
	},
	goto: {
		from: '*' as const,
		to: tap<State>,
	},
} satisfies Rec<FsmTransition<State>>;

describe('logger-plugin', () => {
	it('logs init event on FSM creation', () => {
		const entries: Array<LogEntry<State>> = [];
		makeFsm({
			init: 'idle',
			states: STATES,
			transitions: TRANSITIONS,
			plugins: [loggerPlugin({ handler: (e) => entries.push(e) })],
		});

		expect(entries).toHaveLength(1);
		expect(entries[0].event).toBe('init');
		expect((entries[0] as Extract<LogEntry<State>, { event: 'init' }>).state).toBe('idle');
	});

	it('logs transitions with from, to, and transition name', () => {
		const entries: Array<LogEntry<State>> = [];
		const fsm = makeFsm({
			init: 'idle',
			states: STATES,
			transitions: TRANSITIONS,
			plugins: [loggerPlugin({ handler: (e) => entries.push(e) })],
		});

		fsm.fetch();
		fsm.resolve();

		const transitions = entries.filter((e) => e.event === 'transition');
		expect(transitions).toHaveLength(2);

		expect(transitions[0].from).toBe('idle');
		expect(transitions[0].to).toBe('loading');
		expect(transitions[0].transition).toBe('fetch');

		expect(transitions[1].from).toBe('loading');
		expect(transitions[1].to).toBe('done');
		expect(transitions[1].transition).toBe('resolve');
	});

	it('logs transitions with args for dynamic transitions', () => {
		const entries: Array<LogEntry<State>> = [];
		const fsm = makeFsm({
			init: 'idle',
			states: STATES,
			transitions: TRANSITIONS,
			plugins: [loggerPlugin({ handler: (e) => entries.push(e) })],
		});

		fsm.goto('loading');

		const transitions = entries.filter((e) => e.event === 'transition');
		expect(transitions).toHaveLength(1);
		expect(transitions[0].args).toEqual(['loading']);
	});

	it('logs errors for forbidden transitions', () => {
		const entries: Array<LogEntry<State>> = [];
		const fsm = makeFsm({
			init: 'idle',
			states: STATES,
			transitions: TRANSITIONS,
			plugins: [loggerPlugin({ handler: (e) => entries.push(e) })],
			onError: () => {},
		});

		fsm.resolve(); // forbidden: resolve requires from: 'loading'

		const errors = entries.filter((e) => e.event === 'error');
		expect(errors).toHaveLength(1);
		expect(errors[0].message).toContain('resolve');
		expect(errors[0].message).toContain('forbidden');
	});

	it('disable() stops logging', () => {
		const entries: Array<LogEntry<State>> = [];
		const fsm = makeFsm({
			init: 'idle',
			states: STATES,
			transitions: TRANSITIONS,
			plugins: [loggerPlugin({ handler: (e) => entries.push(e) })],
		});

		fsm.logger.disable();
		fsm.fetch();

		const transitions = entries.filter((e) => e.event === 'transition');
		expect(transitions).toHaveLength(0);
	});

	it('enable() resumes logging after disable()', () => {
		const entries: Array<LogEntry<State>> = [];
		const fsm = makeFsm({
			init: 'idle',
			states: STATES,
			transitions: TRANSITIONS,
			plugins: [loggerPlugin({ handler: (e) => entries.push(e) })],
		});

		fsm.logger.disable();
		fsm.fetch();
		fsm.logger.enable();
		fsm.resolve();

		const transitions = entries.filter((e) => e.event === 'transition');
		expect(transitions).toHaveLength(1);
		expect(transitions[0].transition).toBe('resolve');
	});

	it('enabled() returns current status', () => {
		const fsm = makeFsm({
			init: 'idle',
			states: STATES,
			transitions: TRANSITIONS,
			plugins: [loggerPlugin()],
		});

		expect(fsm.logger.enabled()).toBe(true);
		fsm.logger.disable();
		expect(fsm.logger.enabled()).toBe(false);
		fsm.logger.enable();
		expect(fsm.logger.enabled()).toBe(true);
	});

	it('respects enabled: false in options', () => {
		const entries: Array<LogEntry<State>> = [];
		const fsm = makeFsm({
			init: 'idle',
			states: STATES,
			transitions: TRANSITIONS,
			plugins: [loggerPlugin({ enabled: false, handler: (e) => entries.push(e) })],
		});

		expect(fsm.logger.enabled()).toBe(false);
		fsm.fetch();
		expect(entries).toHaveLength(0);
	});

	it('entries have timestamps', () => {
		const entries: Array<LogEntry<State>> = [];
		const before = Date.now();
		const fsm = makeFsm({
			init: 'idle',
			states: STATES,
			transitions: TRANSITIONS,
			plugins: [loggerPlugin({ handler: (e) => entries.push(e) })],
		});

		fsm.fetch();
		const after = Date.now();

		for (const entry of entries) {
			expect(entry.timestamp).toBeGreaterThanOrEqual(before);
			expect(entry.timestamp).toBeLessThanOrEqual(after);
		}
	});
});
