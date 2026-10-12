/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/// <reference types="vitest" />
import { defineConfig } from 'vite';

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

		viteTsConfigPaths({
			root: '../../../'
		})
	],

	// Configuration for building your library.
	// See: https://vitejs.dev/guide/build.html#library-mode
	build: {
		lib: {
			// Could also be a dictionary or array of multiple entry points.
			entry: 'src/index.ts',
			name: 'bublik-router',
			fileName: 'index',
			// Change this to the formats you want to support.
			// Don't forgot to update your package.json as well.
			formats: ['es', 'cjs']
		},
		rollupOptions: {
			// External packages that should not be bundled into your library.
			external: []
		}
	},

	server: {
		// The codec specs load the e2e page objects (`*_URL_PARAMS` tables) and
		// the URL snapshot from the app, outside this project's root.
		fs: { allow: [join(__dirname, '../../../')] }
	},

	test: {
		reporters: ['default'],
		globals: true,
		// The router under test is created with a memory history, but
		// `@tanstack/react-router` still expects a DOM to exist.
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
	}
});
