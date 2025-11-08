import type {Rec} from '../utils';
import type {Label} from './Label';
import type {StateMethods} from './StateMethods';
import type {Transition} from './Transition';
import type {TransitionMethods} from './TransitionMethods';

export type Methods<TState extends Label, TTransitions extends Rec<Transition<TState>>>
	= TransitionMethods<TTransitions> & StateMethods<TState>;
