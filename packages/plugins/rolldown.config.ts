import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';
import { minify } from 'rollup-plugin-swc3';

const INPUT = { index: 'lib/index.ts', history: 'lib/history/index.ts' };

export default defineConfig([
	{
		input: INPUT,
		output: {
			dir: 'dist',
			format: 'es',
		},
		transform: {
			target: 'ES2015',
		},
		external: ['@uuxxx/fsm', '@uuxxx/utils'],
		plugins: [
			minify({
				compress: true,
				module: true,
				ecma: 2015,
			}),
		],
		platform: 'neutral',
		tsconfig: 'tsconfig.json',
	},
	{
		input: INPUT,
		output: {
			dir: 'dist',
			format: 'es',
		},
		external: ['@uuxxx/fsm', '@uuxxx/utils'],
		plugins: [
			dts({
				newContext: true,
				incremental: false,
				build: false,
				emitDtsOnly: true,
			}),
			{
				name: 'strip-comments',
				renderChunk(code, chunk) {
					if (chunk.fileName.endsWith('.d.ts')) {
						return code
							.replace(/^\/\/#region.*$/gm, '')
							.replace(/^\/\/#endregion.*$/gm, '')
							.replace(/^\s*$(?:\r\n?|\n)/gm, '');
					}
				},
			},
		],
		platform: 'neutral',
		tsconfig: 'tsconfig.json',
	},
]);
