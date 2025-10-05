import type {AnyFn} from '../types/AnyFn';

export const guard = {
	string: (value: unknown): value is string => typeof value === 'string',
	function: (value: unknown): value is AnyFn => typeof value === 'function',
};
