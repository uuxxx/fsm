import type {Noop, Rec} from '../utils';
import type {Transition} from './Transition';
import type {Label} from './Label';

export type TransitionMethods<TTransitions extends Rec<Transition<Label>>> = {
	[K in keyof TTransitions]: TTransitions[K]['to'] extends Label ? () => TTransitions[K]['to'] : TTransitions[K]['to'];
};
