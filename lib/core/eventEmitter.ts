import type {Rec} from '@uuxxx/utils';
import type {Label} from '../types/Label';
import type {LifecycleMethods} from '../types/LifecycleMethods';
import type {Transition} from '../types/Transition';
import {makeEventEmitter as _makeEventEmitter, type EventEmitter as _EventEmitter} from '@uuxxx/utils/event-emitter';

type EventMap<TState extends Label, TTransitions extends Rec<Transition<TState>>> = LifecycleMethods<TState, TTransitions> & {
	init: (state: TState) => void;
	error: (msg: string) => void;
	warn: (msg: string) => void;
};

export type EventEmitter<TState extends Label, TTransitions extends Rec<Transition<TState>>> = _EventEmitter<EventMap<TState, TTransitions>>;

export const makeEventEmitter
	= <TState extends Label, TTransitions extends Rec<Transition<TState>>>() => _makeEventEmitter<EventMap<TState, TTransitions>>();

