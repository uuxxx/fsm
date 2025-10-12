import type {Label} from './types/Label';
import type {Lifecycle, LifecycleMethods} from './types/LifecycleMethods';
import type {Transition} from './types/Transition';
import {
	guard, type Entries, type Keyof, type Rec,
	type Ulx,
} from './utils';

type Invoke<TState extends Label, TTransitions extends Rec<Transition<TState>>>
	= Required<Record<Keyof<LifecycleMethods<TState, TTransitions>>, (lifecycle: Lifecycle<TState, Entries<TTransitions>>) => {
		isOk: boolean;
	}>>;

export const makeInvoke = <TState extends Label, TTransitions extends Rec<Transition<TState>>>(methods: Ulx<LifecycleMethods<TState, TTransitions>>): Invoke<TState, TTransitions> => ({
	onBeforeTransition: lifecycle => ({
		isOk: !guard.false(methods?.onBeforeTransition?.(lifecycle)),
	}),
	onAfterTransition: lifecycle => ({
		isOk: !guard.false(methods?.onAfterTransition?.(lifecycle)),
	}),
});
