/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { defineConfig, devices } from '@playwright/test';
import type { ReporterDescription } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';

import { SHARED_STORAGE_STATE } from './e2e/support/session';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4400/v2/';

const preset = nxE2EPreset(__filename, { testDir: './e2e' });

const BROWSER_DEVICES = {
	chromium: devices['Desktop Chrome'],
	firefox: devices['Desktop Firefox'],
	webkit: devices['Desktop Safari']
} as const;

type BrowserName = keyof typeof BROWSER_DEVICES;

const requested = (process.env['E2E_BROWSERS'] ?? 'chromium,firefox,webkit')
	.split(',')
	.map((name) => name.trim())
	.filter(Boolean);

const known = Object.keys(BROWSER_DEVICES);
const unknown = requested.filter((name) => !known.includes(name));
if (!requested.length || unknown.length) {
	throw new Error(
		`E2E_BROWSERS must be a comma-separated subset of ${known.join(', ')}, ` +
			`got '${process.env['E2E_BROWSERS']}'`
	);
}

const browsers = requested as BrowserName[];
const setupDevice = BROWSER_DEVICES[browsers[0]];

export default defineConfig({
	...preset,
	reporter: [
		...((preset.reporter ?? []) as ReporterDescription[]),
		['json', { outputFile: '../../dist/.playwright/apps/bublik/results.json' }]
	],
	timeout: 60_000,
	expect: { timeout: 15_000 },
	fullyParallel: false,
	use: {
		baseURL,
		actionTimeout: 15_000,
		navigationTimeout: 30_000,
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure',
		video: 'retain-on-failure'
	},
	projects: [
		{ name: 'auth', testMatch: 'auth.setup.ts', use: { ...setupDevice } },
		{
			name: 'import',
			testMatch: 'import.setup.ts',
			use: { ...setupDevice, storageState: SHARED_STORAGE_STATE },
			dependencies: ['auth']
		},
		...browsers.map((name) => ({
			name,
			use: { ...BROWSER_DEVICES[name], storageState: SHARED_STORAGE_STATE },
			dependencies: ['auth', 'import']
		}))
	]
});
