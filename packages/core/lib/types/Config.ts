import type { EmptyArray, Rec } from '@uuxxx/utils';
import type { Label } from './Label';
import type { LifecycleMethods } from './LifecycleMethods';
import type { Plugin } from './Plugin';
import type { Transition } from './Transition';

/** Configuration object for {@link makeFsm}. */
export type Config<TState extends Label, TTransitions extends Rec<Transition<TState>>, TPlugins extends Array<Plugin<TState, TTransitions>> = EmptyArray> = {
	/** Initial state of the FSM. */
	init: TState;
	/** All valid states. The FSM will reject transitions to states not in this list. */
	states: TState[];
	/** Transition definitions. Each key becomes a method on the FSM instance. */
	transitions: TTransitions;
	/** Optional lifecycle hooks (`onBeforeTransition`, `onAfterTransition`, `onError`). */
	methods?: LifecycleMethods<TState, TTransitions>;
	/** Optional plugins to extend the FSM with additional APIs. */
	plugins?: TPlugins;
};
