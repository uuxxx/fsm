import type {Rec} from '../utils';
import type {Label} from './Label';
import type {Plugin} from './Plugin';
import type {Transition} from './Transition';

export type PluginsMethods<TState extends Label, TTransitions extends Rec<Transition<TState>>, TPlugins extends Array<Plugin<TState, TTransitions>>> = {
	[K in ReturnType<TPlugins[number]>['name']]: Extract<ReturnType<TPlugins[number]>, {
		name: K;
	}>['api']
};

