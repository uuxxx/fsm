// @ts-expect-error does not have d.ts
import config from 'eslint-config-xo-typescript';
import {defineConfig, globalIgnores} from 'eslint/config';

export default defineConfig([
	// https://oss.issuehunt.io/r/xojs/xo/issues/798
	config.filter((item: any) => !item?.language?.startsWith('json/')),
	{
		rules: {
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/naming-convention': 'off',
		},
	},
	globalIgnores([
		'./dist',
		'./node_modules',
	]),
]);
