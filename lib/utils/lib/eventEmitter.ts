import type {AnyFn} from '../types/AnyFn';
import type {KeyOf} from '../types/KeyOf';
import type {Noop} from '../types/Noop';
import type {Rec} from '../types/Rec';

type EventMap = Rec<any[]>;

type EventEmitter<T extends EventMap> = {
	listen: <K extends KeyOf<T>>(id: K, listener: (...args: T[K]) => void) => Noop;
	unlisten: (id: KeyOf<T>, listener: Noop) => void;
	emit: <K extends KeyOf<T>>(id: K, ...args: T[K]) => void;
	unlistenAll: (id: KeyOf<T>) => void;
};

export const makeEventEmitter = <T extends EventMap>(): EventEmitter<T> => {
	const map = new Map<KeyOf<T>, AnyFn[]>();

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
			map.get(id)?.forEach(listener => {
				listener(...args);
			});
		},
		unlistenAll(id) {
			map.delete(id);
		},
	};
};
