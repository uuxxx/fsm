import {sum} from './index';

describe('sum', () => {
	test('common', () => {
		expect(sum(1, 2)).toBe(3);
	});
});
