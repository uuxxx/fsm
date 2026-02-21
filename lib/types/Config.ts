import type {Rec} from '../utils';
import type {Label} from './Label';
import type {LifecycleMethods} from './LifecycleMethods';
import type {Plugin} from './Plugin';
import type {Transition} from './Transition';

// eslint-disable-next-line @typescript-eslint/no-restricted-types
export type Config<TState extends Label, TTransitions extends Rec<Transition<TState>>, TPlugins extends Array<Plugin<TState, TTransitions>> = []> = {
	init: TState;
	states: TState[];
	transitions: TTransitions;
	methods?: LifecycleMethods<TState, TTransitions>;
	plugins?: TPlugins;
};
