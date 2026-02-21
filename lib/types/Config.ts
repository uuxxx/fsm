import type {EmptyArray, Rec} from '../utils';
import type {Label} from './Label';
import type {LifecycleMethods} from './LifecycleMethods';
import type {Plugin} from './Plugin';
import type {Transition} from './Transition';

export type Config<TState extends Label, TTransitions extends Rec<Transition<TState>>, TPlugins extends Array<Plugin<TState, TTransitions>> = EmptyArray> = {
	init: TState;
	states: TState[];
	transitions: TTransitions;
	methods?: LifecycleMethods<TState, TTransitions>;
	plugins?: TPlugins;
};
