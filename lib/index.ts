import {error} from './error';
import type {Config} from './types/Config';
import type {Label} from './types/Label';
import type {Methods} from './types/Methods';
import type {StateMethods} from './types/StateMethods';
import type {Transition} from './types/Transition';
import type {TransitionMethods} from './types/TransitionMethods';
import {guard, type AnyFn, type Rec} from './utils';

export const makeFsm = <TState extends Label, TTransitions extends Rec<Transition<TState>>>(config: Config<TState, TTransitions>): Methods<TState, TTransitions> => {
	let state: TState = config.init;

	const stateMethods: StateMethods<TState> = {
		state: () => state,
		allStates: () => [...config.states],
	};

	const transitionMethods = Object.entries(config.transitions).reduce((acc, [name, transition]) => {
		(acc as Rec<AnyFn>)[name] = (...args: any[]) => {
			const isErr = guard.array(transition.from) ? !transition.from.includes(state) : transition.from !== '*' && transition.from !== state;

			if (isErr) {
				error.transitionForbidden({
					state,
					from: transition.from,
					name,
				});
			}

			if (!guard.function(transition.to)) {
				state = transition.to;
				return state;
			}

			const value = transition.to(...args);

			if (!guard.promise(value)) {
				state = value;
				return state;
			}

			return value
				.then(resolvedValue => {
					state = resolvedValue;
					return state;
				});
		};

		return acc;
	}, {} as TransitionMethods<TTransitions>);

	return {
		...transitionMethods,
		...stateMethods,
	};
};

