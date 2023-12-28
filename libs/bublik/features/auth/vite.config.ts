/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import { joinPathFragments } from '@nx/devkit';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
	cacheDir: '../../../../node_modules/.vite/bublik-features-auth',

	plugins: [
		dts({
			entryRoot: 'src',
			tsConfigFilePath: joinPathFragments(__dirname, 'tsconfig.lib.json'),
			skipDiagnostics: true
		}),
		react(),
		viteTsConfigPaths({
			root: '../../../../'
		}),
		svgr({ svgrOptions: { ref: true } })
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
			name: 'bublik-features-auth',
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
		globals: true,
		cache: {
			dir: '../../../../node_modules/.vitest'
		},
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		setupFiles: [`${process.cwd()}/setup-globals.ts`]
		// globalSetup: './setup-globals.ts',
	}
});
