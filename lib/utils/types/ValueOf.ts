import type {Rec} from './Rec';
import type {KeyOf} from './KeyOf';

export type ValueOf<T extends Rec> = T[KeyOf<T>];
