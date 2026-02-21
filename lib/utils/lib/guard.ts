/* eslint-disable @typescript-eslint/no-restricted-types */
import type {AnyFn} from '../types/AnyFn';

export const guard = {
	nlx: (value: unknown): value is null => value === null,
	ulx: (value: unknown): value is undefined => value === undefined,
	nil: (value: unknown): value is undefined | null => guard.nlx(value) || guard.ulx(value),
	not: {
		nlx: <T = unknown>(value: T): value is Exclude<T, null> => value !== null,
		ulx: <T = unknown>(value: T): value is Exclude<T, undefined> => value !== undefined,
		nil: <T = unknown>(value: T): value is Exclude<T, undefined | null> => guard.not.nlx(value) && guard.not.ulx(value),
	},
	array: <T = unknown>(value: unknown): value is T[] => Array.isArray(value),
	string: (value: unknown): value is string => typeof value === 'string',
	function: (value: unknown): value is AnyFn => typeof value === 'function',
	promise: <T = unknown>(value: unknown): value is Promise<T> => value instanceof Promise,
	boolean: (value: unknown): value is boolean => typeof value === 'boolean',
	false: (value: unknown): value is false => value === false,
	true: (value: unknown): value is true => value === true,
};

