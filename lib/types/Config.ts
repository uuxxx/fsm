import type {Rec} from '../utils';
import type {Label} from './Label';
import type {LifecycleMethods} from './LifecycleMethods';
import type {Transition} from './Transition';

export type Config<TState extends Label, TTransitions extends Rec<Transition<TState>>> = {
	init: TState;
	states: TState[];
	transitions: TTransitions;
	methods?: LifecycleMethods<TState, TTransitions>;
};
