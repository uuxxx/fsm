import type {Label} from './Label';

export type Transition<TState extends Label, TTransition extends Label> = {
	name: TTransition;
	from: '*' | TState;
	to: TState | ((...args: any[]) => TState);
};
