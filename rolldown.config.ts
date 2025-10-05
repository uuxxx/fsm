import {defineConfig} from 'rolldown';
import {dts} from 'rolldown-plugin-dts';
import {minify} from 'rollup-plugin-swc3';

export default defineConfig([
	{
		input: 'src/index.ts',
		output: {
			dir: 'dist',
			format: 'es',
		},
		transform: {
			target: 'ES2015',
		},
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
		input: 'src/index.ts',
		output: {
			dir: 'dist',
			format: 'es',
		},
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
