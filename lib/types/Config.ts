import type {Label} from './Label';
import type {Transition} from './Transition';

export type Config<TState extends Label, TTransitions extends Array<Transition<TState, Label>>> = {
	init: TState;
	states: TState[];
	transitions: TTransitions;
};
