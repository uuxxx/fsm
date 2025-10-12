import type {Keyof} from './Keyof';
import type {Rec} from './Rec';

export type Entries<T extends Rec> = {
	[K in Keyof<T>]: [K, T[K]];
}[Keyof<T>];

