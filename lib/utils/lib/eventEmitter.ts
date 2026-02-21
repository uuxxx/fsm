import type {AnyFn} from '../types/AnyFn';
import type {KeyOf} from '../types/Keyof';
import type {Noop} from '../types/Noop';
import type {Rec} from '../types/Rec';
import type {ValueOf} from '../types/ValueOf';
import {guard} from './guard';

type EventMap = Rec<AnyFn>;

export type EventEmitter<T extends EventMap> = {
	listen: <K extends KeyOf<T>>(id: K, listener: T[K]) => Noop;
	unlisten: (id: KeyOf<T>, listener: Noop) => void;
	emit: <K extends KeyOf<T>>(id: K, ...args: Parameters<T[K]>) => Array<ReturnType<T[K]>>;
	unlistenAll: (id: KeyOf<T>) => void;
};

export const makeEventEmitter = <T extends EventMap>(): EventEmitter<T> => {
	const map = new Map<KeyOf<T>, Array<ValueOf<T>>>();

	return {
		listen(id, listener) {
			if (!map.has(id)) {
				map.set(id, []);
			}

			map.get(id)?.push(listener);

			return () => {
				this.unlisten(id, listener);
			};
		},
		unlisten(id, listener) {
			const listeners = map.get(id);

			if (!listeners) {
				return;
			}

			const nextListeners = listeners.filter(fn => fn !== listener);

			if (!nextListeners.length) {
				map.delete(id);
				return;
			}

			map.set(id, nextListeners);
		},
		emit(id, ...args) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return map.get(id)?.map(listener => listener(...args)).filter(guard.not.ulx) ?? [];
		},
		unlistenAll(id) {
			map.delete(id);
		},
	};
};
