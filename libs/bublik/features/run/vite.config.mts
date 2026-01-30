/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
	root: __dirname,
	plugins: [react(), nxViteTsPaths(), svgr({})],

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
			name: 'bublik-features-run',
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
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		reporters: ['default'],
		setupFiles: ['../../../../setup-globals.ts'],
		coverage: {
			reportsDirectory: '../../../../coverage/libs/bublik/features/run',
			provider: 'v8'
		}
	}
});
