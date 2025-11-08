/**
 * @type {import('jest').Config}
 */
// eslint-disable-next-line
const config = {
	verbose: true,
	moduleFileExtensions: ['js', 'ts'],
	rootDir: '.',
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig:
			'./tsconfig.jest.json',
		}],
	},
	testMatch: ['**/*.test.[jt]s'],
};
