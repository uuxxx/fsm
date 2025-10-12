import type {AnyFn} from '../types/AnyFn';

export const guard = {
	array: <T = unknown>(value: unknown): value is T[] => Array.isArray(value),
	string: (value: unknown): value is string => typeof value === 'string',
	function: (value: unknown): value is AnyFn => typeof value === 'function',
	promise: <T = unknown>(value: unknown): value is Promise<T> => value instanceof Promise,
	false: (value: unknown): value is false => value === false,
	true: (value: unknown): value is true => value === true,
};
