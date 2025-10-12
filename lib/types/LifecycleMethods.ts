import type {
	AnyFn,
	Entries, Key, Noop, Rec, Vdx,
} from '../utils';
import type {Transition} from './Transition';
import type {Label} from './Label';

export type Lifecycle<TState extends Label, TEntry extends [Key, Transition<Label>]> = {
	args?: Parameters<Extract<TEntry[1]['to'], AnyFn>>;
	transition: TEntry[0];
	from: TState;
	to: TState;
};

type LifecycleMethod<TState extends Label, TTransitions extends Rec<Transition<TState>>>
	= (lifecycle: Lifecycle<TState, Entries<TTransitions>>) => void;

type CancelableLifecycleMethod<TState extends Label, TTransitions extends Rec<Transition<TState>>>
	= (lifecycle: Lifecycle<TState, Entries<TTransitions>>) => Vdx<boolean>;

export type LifecycleMethods<TState extends Label, TTransitions extends Rec<Transition<TState>>> = {
	onBeforeTransition?: CancelableLifecycleMethod<TState, TTransitions>;
	onAfterTransition?: LifecycleMethod<TState, TTransitions>;
};
