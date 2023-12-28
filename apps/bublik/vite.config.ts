/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import svgr from 'vite-plugin-svgr';

export default defineConfig(async ({ mode }) => {
	const mdx = await import('@mdx-js/rollup');

	let env: Record<string, string> = {};
	if (mode === 'development') {
		// You need to run `pnpm start again if you change env to load it correctly`
		env = loadEnv(mode, process.cwd(), 'BUBLIK_UI_DEV');
	}

	return {
		server: {
			port: 4200,
			host: 'localhost',
			proxy: {
				'/api/v2': {
					target: env['BUBLIK_UI_DEV_BACKEND_TARGET'],
					changeOrigin: true,
					secure: false
				},
				'/auth': {
					target: env['BUBLIK_UI_DEV_BACKEND_TARGET'],
					changeOrigin: true,
					secure: false
				},
				'/external': {
					target: env['BUBLIK_UI_DEV_LOGS_TARGET'],
					changeOrigin: true,
					secure: false,
					auth: env['BUBLIK_UI_DEV_LOGS_AUTH'],
					followRedirects: true,
					rewrite: (path) => {
						const externalUrl = /=([^&]+)/.exec(path)?.[1];

						if (!externalUrl) {
							throw new Error(`[PROXY] externalUrl not found: ${path}`);
						}

						console.log(`[PROXY] Rewrite path: ${path}`);
						console.log(`[PROXY] External URL: ${externalUrl}`);

						return externalUrl;
					}
				}
			}
		},
		optimizeDeps: { include: ['react/jsx-runtime'] },
		plugins: [
			react(),
			nxViteTsPaths(),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			mdx.default({ remarkPlugins: [] }) as any,
			svgr({ svgrOptions: { ref: true } })
		],

		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						echarts: ['echarts'],
						react: ['react', 'react-dom', 'react-router-dom']
					}
				}
			}
		},

		// Uncomment this if you are using workers.
		// worker: {
		//  plugins: [
		//    viteTsConfigPaths({
		//      root: '../../',
		//    }),
		//  ],
		// },

		test: {
			globals: true,
			cache: {
				dir: '../../node_modules/.vitest'
			},
			environment: 'jsdom',
			include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
		}
	};
});
