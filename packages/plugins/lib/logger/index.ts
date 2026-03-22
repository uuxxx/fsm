import type { Rec } from '@uuxxx/utils';
import type { FsmLabel as Label, FsmPlugin as Plugin, FsmTransition as Transition } from '@uuxxx/fsm';

export type LogEntry<TState> =
	| { event: 'init'; timestamp: number; state: TState }
	| { event: 'transition'; timestamp: number; transition: string; from: TState; to: TState; args?: unknown[] }
	| { event: 'error'; timestamp: number; message: string };

export type LoggerOptions<TState> = {
	enabled?: boolean;
	handler?: (entry: LogEntry<TState>) => void;
};

const COLORS = {
	reset: '\x1b[0m',
	cyan: '\x1b[36m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[31m',
	dim: '\x1b[2m',
} as const;

const defaultHandler = <TState>(entry: LogEntry<TState>): void => {
	switch (entry.event) {
		case 'init':
			console.log(`🚀 ${COLORS.cyan}[FSM]${COLORS.reset} init → ${COLORS.green}"${String(entry.state)}"${COLORS.reset}`);
			break;
		case 'transition':
			console.log(
				`⚡ ${COLORS.cyan}[FSM]${COLORS.reset} ${COLORS.yellow}"${String(entry.from)}"${COLORS.reset} → ${COLORS.green}"${String(entry.to)}"${COLORS.reset} ${COLORS.dim}(via ${entry.transition})${COLORS.reset}`,
			);
			break;
		case 'error':
			console.log(`❌ ${COLORS.red}[FSM] error:${COLORS.reset} ${entry.message}`);
			break;
		default:
			break;
	}
};

/**
 * Logger plugin that logs FSM events (init, transitions, errors) for debugging.
 *
 * Exposes methods under `fsm.logger`:
 * - `enable()` — enable logging
 * - `disable()` — disable logging
 * - `enabled()` — check whether logging is currently enabled
 *
 * @example
 * ```ts
 * import { makeFsm } from '@uuxxx/fsm';
 * import { loggerPlugin } from '@uuxxx/fsm-plugins';
 * // or: import { loggerPlugin } from '@uuxxx/fsm-plugins/logger';
 *
 * const fsm = makeFsm({
 *   init: 'idle',
 *   states: ['idle', 'loading', 'done'],
 *   transitions: { fetch: { from: 'idle', to: 'loading' } },
 *   plugins: [loggerPlugin()],
 * });
 *
 * // Console: [FSM] init → "idle"
 *
 * fsm.fetch();
 * // Console: [FSM] "idle" → "loading" (via fetch)
 *
 * fsm.logger.disable();
 * fsm.logger.enabled(); // false
 * ```
 */
export const loggerPlugin = <TState extends Label, TTransitions extends Rec<Transition<TState>>>(options?: LoggerOptions<TState>) =>
	((api) => {
		let _enabled = options?.enabled ?? true;
		const handle = options?.handler ?? defaultHandler;

		const log = (entry: LogEntry<TState>): void => {
			if (_enabled) {
				handle(entry);
			}
		};

		api.init((state) => log({ event: 'init', timestamp: Date.now(), state }));

		api.onAfterTransition(({ transition, from, to, args }) => {
			const entry: LogEntry<TState> = { event: 'transition', timestamp: Date.now(), transition: String(transition), from, to };
			if (args) {
				entry.args = args;
			}
			log(entry);
		});

		api.onError((message) => log({ event: 'error', timestamp: Date.now(), message }));

		return {
			name: 'logger' as const,
			api: {
				enable(): void {
					_enabled = true;
				},
				disable(): void {
					_enabled = false;
				},
				enabled(): boolean {
					return _enabled;
				},
			},
		};
	}) satisfies Plugin<TState, TTransitions>;
