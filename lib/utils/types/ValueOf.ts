import type {Rec} from './Rec';
import type {KeyOf} from './Keyof';

export type ValueOf<T extends Rec> = T[KeyOf<T>];
