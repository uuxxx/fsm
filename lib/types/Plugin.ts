import type {
	AnyFn, KeyOf, Noop, Rec,
} from '../utils';
import type {Label} from './Label';
import type {LifecycleMethods} from './LifecycleMethods';
import type {Transition} from './Transition';

export type ApiForPlugin<TState extends Label, TTransitions extends Rec<Transition<TState>>> = {
	init: (listener: (state: TState) => void) => void;
} & {
	[K in KeyOf<LifecycleMethods<TState, TTransitions>>]-?: (listener: LifecycleMethods<TState, TTransitions>[K]) => Noop
};

type PluginApi = {
	name: string;
	api: Rec<AnyFn>;
};

export type Plugin<TState extends Label = Label, TTransitions extends Rec<Transition<TState>> = Rec<Transition<TState>>>
	= (api: ApiForPlugin<TState, TTransitions>) => PluginApi;
