import {error} from './error';
import type {Config} from './types/Config';
import type {Label} from './types/Label';
import type {Methods} from './types/Methods';
import type {StateMethods} from './types/StateMethods';
import type {Transition} from './types/Transition';
import type {TransitionMethods} from './types/TransitionMethods';
import {guard, type AnyFn} from './utils';

export const makeFsm = <TState extends Label, TTransitions extends Array<Transition<TState, Label>>>(config: Config<TState, TTransitions>): Methods<TState, TTransitions> => {
	let state: TState = config.init;

	const stateMethods: StateMethods<TState> = {
		state: () => state,
		allStates: () => [...config.states],
	};

	const transitionMethods = config.transitions.reduce((acc, item) => {
		(acc as Record<Label, AnyFn>)[item.name] = (...args: any[]) => {
			if (item.from !== '*' && item.from !== state) {
				error.transitionForbidden({
					state,
					from: item.from,
					name: item.name,
				});
			}

			if (!guard.function(item.to)) {
				state = item.to;
				return;
			}

			state = item.to(...args);
		};

		return acc;
	}, {} as TransitionMethods<TTransitions>);

	return {
		...transitionMethods,
		...stateMethods,
	};
};

