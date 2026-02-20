import type {KeyOf} from './KeyOf';
import type {Rec} from './Rec';

export type Entries<T extends Rec> = {
	[K in KeyOf<T>]: [K, T[K]];
}[KeyOf<T>];

