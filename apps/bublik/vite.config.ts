/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */

import { defineConfig, HttpProxy, loadEnv, ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import svgr from 'vite-plugin-svgr';

const createRequestLogger =
	(domain: string) => (proxy: HttpProxy.Server, _options: ProxyOptions) => {
		proxy.on('error', (err, _req, _res) => {
			console.log(`[${domain}] Error:`, err);
		});
		proxy.on('proxyReq', (proxyReq, req, _res) => {
			console.log(`[${domain}] Request:`, req.method, req.url);
		});
		proxy.on('proxyRes', (proxyRes, req, _res) => {
			console.log(`[${domain}] Response:`, proxyRes.statusCode, req.url);
		});
	};

export default defineConfig(async ({ mode }) => {
	const mdx = await import('@mdx-js/rollup');

	let env: Record<string, string> = {};
	if (mode === 'development') {
		// You need to run `pnpm start again if you change env to load it correctly`
		env = loadEnv(mode, process.cwd(), '');
	}

	const URL_PREFIX = env.URL_PREFIX?.replace('/v2', '') ?? '';
	const DJANGO_TARGET = env.BUBLIK_UI_DEV_BACKEND_TARGET;
	const LOGS_TARGET = env.BUBLIK_UI_DEV_LOGS_TARGET;

	// Derived
	const API_PATHNAME = `${URL_PREFIX}/api/v2`;
	const AUTH_PATHNAME = `${URL_PREFIX}/auth`;
	const PERFORMANCE_CHECK_PATHNAME = `${URL_PREFIX}/url_shortner`;
	const URL_SHORT_PATHNAME = `${URL_PREFIX}/performance_check`;
	const EXTERNAL_PATHNAME = `${URL_PREFIX}/external`;

	return {
		root: __dirname,
		server: {
			port: 4200,
			host: 'localhost',
			proxy: {
				[API_PATHNAME]: {
					target: DJANGO_TARGET,
					changeOrigin: true,
					secure: false,
					configure: createRequestLogger('API')
				},
				[AUTH_PATHNAME]: {
					target: DJANGO_TARGET,
					changeOrigin: true,
					secure: false,
					configure: createRequestLogger('AUTH')
				},
				[URL_SHORT_PATHNAME]: {
					target: DJANGO_TARGET,
					changeOrigin: true,
					secure: false,
					configure: createRequestLogger('URL_SHORT')
				},
				[PERFORMANCE_CHECK_PATHNAME]: {
					target: DJANGO_TARGET,
					changeOrigin: true,
					secure: false,
					configure: createRequestLogger('PERFORMANCE')
				},
				[EXTERNAL_PATHNAME]: {
					target: LOGS_TARGET,
					changeOrigin: true,
					secure: false,
					followRedirects: true,
					rewrite: (path: string) => {
						const externalUrl = /=([^&]+)/.exec(path)?.[1];

						if (!externalUrl) {
							throw new Error(`[PROXY] externalUrl not found: ${path}`);
						}

						console.log(`[PROXY] Rewrite path: ${path}`);
						console.log(`[PROXY] External URL: ${externalUrl}`);

						return externalUrl.replace(LOGS_TARGET, '');
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
			outDir: '../../dist/apps/bublik',
			reportCompressedSize: true,
			commonjsOptions: { transformMixedEsModules: true },
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
			reporters: ['default'],
			coverage: {
				reportsDirectory: '../../coverage/apps/bublik',
				provider: 'v8'
			},
			globals: true,
			cache: {
				dir: '../../node_modules/.vitest'
			},
			environment: 'jsdom',
			include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
		}
	};
});
