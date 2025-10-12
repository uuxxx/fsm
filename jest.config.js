/**
 * @type {import('jest').Config}
 */
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
	coverageDirectory: './coverage',
	collectCoverageFrom: ['lib/**/*.{ts,js}'],
	testMatch: ['**/*.test.[jt]s'],
};
