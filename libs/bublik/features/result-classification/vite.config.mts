/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import { join } from 'path';

export default defineConfig({
	plugins: [
		dts({
			tsConfigFilePath: join(__dirname, 'tsconfig.lib.json'),
			// Faster builds by skipping tests. Set this to false to enable type checking.
			skipDiagnostics: true
		}),
		react(),
		viteTsConfigPaths({
			root: '../../../../'
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

	// Configuration for building your library.
	// See: https://vitejs.dev/guide/build.html#library-mode
	build: {
		lib: {
			// Could also be a dictionary or array of multiple entry points.
			entry: 'src/index.ts',
			name: 'bublik-features-result-classification',
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

	test: {
		reporters: ['default'],
		globals: true,
		environment: 'jsdom',
		// Registers the jest-dom matchers and cleans the DOM between tests, which
		// component specs in this lib need once they render more than once.
		// Local rather than the root `setup-globals.ts`: that path does not
		// resolve under vitest here, and it takes tailwind-ui's suite down too.
		setupFiles: ['./setup.ts'],
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
	}
});
