import type {Label} from './Label';

export type Transition<TState extends Label> = {
	from: '*' | TState | TState[];
	to: TState | ((...args: any[]) => TState | Promise<TState>);
};
