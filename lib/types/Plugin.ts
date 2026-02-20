import type {AnyFn, Rec} from '../utils';
import type {Label} from './Label';
import type {LifecycleMethods} from './LifecycleMethods';
import type {Transition} from './Transition';

type ApiForPlugin<TState extends Label, TTransitions extends Rec<Transition<TState>>> = {
	init: (state: TState) => void;
	methods: LifecycleMethods<TState, TTransitions> & {
		unsafe__goto: (state: TState) => TState;
	};
};

type PluginApi = {
	name: string;
	methods: Rec<AnyFn>;
};

export type Plugin<TState extends Label = Label, TTransitions extends Rec<Transition<TState>> = Rec<Transition<TState>>>
	= (api: ApiForPlugin<TState, TTransitions>) => PluginApi;
