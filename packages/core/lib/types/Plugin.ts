import type { AnyFn, Entries, KeyOf, Noop, Rec } from '@uuxxx/utils';
import type { Label } from './Label';
import type { Lifecycle, LifecycleMethods } from './LifecycleMethods';
import type { StateMethods } from './StateMethods';
import type { Transition } from './Transition';

/** API object passed to each plugin during registration. Provides state access, lifecycle hooks, and error listeners. */
export type ApiForPlugin<TState extends Label, TTransitions extends Rec<Transition<TState>>> = {
	init: (listener: (state: TState) => void) => void;
	onError: (listener: (msg: string, lifecycle?: Lifecycle<TState, Entries<TTransitions>>) => void) => Noop;
	onWarn: (listener: (msg: string, lifecycle: Lifecycle<TState, Entries<TTransitions>>) => void) => Noop;
} & StateMethods<TState> & {
		[K in Exclude<KeyOf<LifecycleMethods<TState, TTransitions>>, 'onError' | 'onWarn'>]-?: (listener: LifecycleMethods<TState, TTransitions>[K]) => Noop;
	};

type PluginApi = {
	name: string;
	api: Rec<AnyFn>;
};

/**
 * A plugin is a function that receives the {@link ApiForPlugin} and returns
 * `{ name, api }` — the name becomes a namespace on the FSM instance,
 * and `api` methods are accessible under that namespace.
 */
export type Plugin<TState extends Label = Label, TTransitions extends Rec<Transition<TState>> = Rec<Transition<TState>>> = (api: ApiForPlugin<TState, TTransitions>) => PluginApi;
