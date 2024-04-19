/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
	root: __dirname,
	cacheDir: '../../node_modules/.vite/apps/bublik-logs',

	server: {
		port: 4200,
		host: 'localhost'
	},

	preview: {
		port: 4300,
		host: 'localhost'
	},

	plugins: [react(), nxViteTsPaths(), svgr({ svgrOptions: { ref: true } })],

	// Uncomment this if you are using workers.
	// worker: {
	//  plugins: [ nxViteTsPaths() ],
	// },

	build: {
		outDir: '../../dist/apps/bublik-logs',
		reportCompressedSize: true,
		commonjsOptions: {
			transformMixedEsModules: true
		}
	},

	test: {
		globals: true,
		cache: {
			dir: '../../node_modules/.vitest'
		},
		environment: 'jsdom',
		include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

		reporters: ['default'],
		coverage: {
			reportsDirectory: '../../coverage/apps/bublik-logs',
			provider: 'v8'
		}
	}
});
