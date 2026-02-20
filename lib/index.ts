import {error} from './error';
import {makeInvoke} from './lifecycle';
import type {Config} from './types/Config';
import type {Label} from './types/Label';
import type {Lifecycle} from './types/LifecycleMethods';
import type {Methods} from './types/Methods';
import type {Plugin} from './types/Plugin';
import type {PluginsMethods} from './types/PluginsMethods';
import type {StateMethods} from './types/StateMethods';
import type {Transition} from './types/Transition';
import type {TransitionMethods} from './types/TransitionMethods';
import {
	guard, type AnyFn, type Entries, type Rec, type Ulx,
} from './utils';

export const makeFsm = <TState extends Label, TTransitions extends Rec<Transition<TState>>, TPlugins extends Array<Plugin<TState, TTransitions>>>
(config: Config<TState, TTransitions, TPlugins>): Methods<TState, TTransitions, TPlugins> => {
	let state: TState = config.init;

	let pending: Ulx<Label>;

	const stateMethods: StateMethods<TState> = {
		state: () => state,
		allStates: () => [...config.states],
	};

	const invoke = makeInvoke<TState, TTransitions>(config.methods);

	const transitionMethods = Object.entries(config.transitions).reduce((acc, [name, transition]) => {
		(acc as Rec<AnyFn>)[name] = (...args: any[]) => {
			const isErr
				= guard.array(transition.from)
					? !transition.from.includes(state)
					: transition.from !== '*' && transition.from !== state;

			if (isErr) {
				error.transitionForbidden({
					state,
					from: transition.from,
					name,
				});
			}

			if (pending) {
				error.hasPendingTransition({
					pending,
					current: name,
				});
			}

			if (!guard.function(transition.to)) {
				const lifecycle: Lifecycle<TState, Entries<TTransitions>> = {
					transition: name,
					from: state,
					to: transition.to,
				};

				const {isOk} = invoke.onBeforeTransition(lifecycle);

				if (isOk) {
					state = transition.to;
					invoke.onAfterTransition(lifecycle);
				}

				return state;
			}

			const value = transition.to(...args);

			if (!guard.promise(value)) {
				const lifecycle: Lifecycle<TState, Entries<TTransitions>> = {
					transition: name,
					from: state,
					to: value,
					// @ts-expect-error TODO: fix type issue
					args,
				};

				const {isOk} = invoke.onBeforeTransition(lifecycle);

				if (isOk) {
					state = value;
					invoke.onAfterTransition(lifecycle);
				}

				return state;
			}

			pending = name;

			return value
				.then(resolvedValue => {
					pending = undefined;

					const lifecycle: Lifecycle<TState, Entries<TTransitions>> = {
						transition: name,
						from: state,
						to: resolvedValue,
						// @ts-expect-error TODO: fix type issue
						args,
					};

					const {isOk} = invoke.onBeforeTransition(lifecycle);

					if (isOk) {
						state = resolvedValue;
						invoke.onAfterTransition(lifecycle);
					}

					return state;
				});
		};

		return acc;
	}, {} as TransitionMethods<TTransitions>);

	const pluginsMethods = {} as PluginsMethods<TState, TTransitions, TPlugins>;

	return {
		...transitionMethods,
		...stateMethods,
		...pluginsMethods,
	};
};

