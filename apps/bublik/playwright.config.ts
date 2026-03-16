/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4400/v2/';

export default defineConfig({
	...nxE2EPreset(__filename, { testDir: './e2e' }),
	use: {
		baseURL,
		trace: 'on-first-retry'
	},
	projects: [
		{ name: 'auth', testMatch: 'auth.setup.ts' },
		{
			name: 'import',
			testMatch: 'import.setup.ts',
			use: { storageState: 'e2e/.auth/state.json' },
			dependencies: ['auth']
		},
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'e2e/.auth/state.json'
			},
			dependencies: ['auth', 'import']
		},
		{
			name: 'firefox',
			use: {
				...devices['Desktop Firefox'],
				storageState: 'e2e/.auth/state.json'
			},
			dependencies: ['auth', 'import']
		},
		{
			name: 'webkit',
			use: {
				...devices['Desktop Safari'],
				storageState: 'e2e/.auth/state.json'
			},
			dependencies: ['auth', 'import']
		}
	]
});
