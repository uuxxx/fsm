import type {Rec} from '../utils';
import type {Label} from './Label';
import type {Transition} from './Transition';

export type Config<TState extends Label, TTransitions extends Rec<Transition<Label>>> = {
	init: TState;
	states: TState[];
	transitions: TTransitions;
};
