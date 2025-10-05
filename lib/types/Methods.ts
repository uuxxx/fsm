import type {Label} from './Label';
import type {StateMethods} from './StateMethods';
import type {Transition} from './Transition';
import type {TransitionMethods} from './TransitionMethods';

export type Methods<TState extends Label, TTransitions extends Array<Transition<Label, Label>>> = TransitionMethods<TTransitions> & StateMethods<TState>;
