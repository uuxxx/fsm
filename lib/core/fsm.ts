import {makeEventEmitter} from './eventEmitter';
import {makePluginsMethods} from './plugins';
import {makeTransitionMethods} from './transitions';
import type {Config} from '../types/Config';
import type {Label} from '../types/Label';
import type {LifecycleMethods} from '../types/LifecycleMethods';
import type {Methods} from '../types/Methods';
import type {Plugin} from '../types/Plugin';
import type {StateMethods} from '../types/StateMethods';
import type {Transition} from '../types/Transition';
import {
	type KeyOf,
	type Rec,
} from '../utils';

export const makeFsm = <TState extends Label, TTransitions extends Rec<Transition<TState>>, TPlugins extends Array<Plugin<TState, TTransitions>>>
(config: Config<TState, TTransitions, TPlugins>): Methods<TState, TTransitions, TPlugins> => {
	let state: TState = config.init;
	const eventEmitter = makeEventEmitter<TState, TTransitions>();

	Object.entries(config.methods ?? {}).forEach(([name, method]) => {
		eventEmitter.listen(name as KeyOf<LifecycleMethods<TState, TTransitions>>, method);
	});

	eventEmitter.listen('onAfterTransition', ({to}) => {
		state = to;
	});

	eventEmitter.listen('error', msg => {
		throw new Error(`[FSM]: ${msg}`);
	});

	const stateMethods: StateMethods<TState> = {
		state: () => state,
		allStates: () => [...config.states],
	};

	const transitionMethods = makeTransitionMethods<TState, TTransitions>(config.transitions, eventEmitter, stateMethods.state);
	const pluginsMethods = makePluginsMethods<TState, TTransitions, TPlugins>(config.plugins, eventEmitter, stateMethods);

	eventEmitter.emit('init', state);

	return {
		...stateMethods,
		...pluginsMethods,
		...transitionMethods,
	};
};

