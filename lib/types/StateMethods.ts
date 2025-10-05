import type {Label} from './Label';

export type StateMethods<TState extends Label> = {
	state: () => TState;
	allStates: () => TState[];
};
