/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import dts from 'vite-plugin-dts';
import { join } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	// Configuration for building your library.
	// See: https://vitejs.dev/guide/build.html#library-mode
	cacheDir: '../../../../node_modules/.vite/bublik-features-session-log',
	build: {
		lib: {
			// Could also be a dictionary or array of multiple entry points.
			entry: 'src/index.ts',
			name: 'bublik-features-session-log',
			fileName: 'index',
			// Change this to the formats you want to support.
			// Don't forgot to update your package.json as well.
			formats: ['es', 'cjs']
		},
		rollupOptions: {
			// External packages that should not be bundled into your library.
			external: ['react', 'react-dom', 'react/jsx-runtime']
		}
	},
	plugins: [
		...[
			react(),
			viteTsConfigPaths({
				root: '../../../../'
			})
		],
		dts({
			entryRoot: 'src',
			tsConfigFilePath: join(__dirname, 'tsconfig.lib.json'),
			skipDiagnostics: true
		})
	],

	// Uncomment this if you are using workers.
	// worker: {
	//  plugins: [
	//    viteTsConfigPaths({
	//      root: '../../../../',
	//    }),
	//  ],
	// },

	test: {
		reporters: ['default'],
		globals: true,
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
	}
});
