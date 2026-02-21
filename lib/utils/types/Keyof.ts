import type {Rec} from './Rec';

export type KeyOf<T extends Rec> = keyof T;
