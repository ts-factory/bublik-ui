/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test';

import { ConfigPage } from './pages/config-page';
import { DashboardPage } from './pages/dashboard-page';
import { HistoryPage } from './pages/history-page';
import { ImportPage } from './pages/import-page';
import { RunsPage } from './pages/runs-page';
import { requireManifest } from './support/manifest';
import { representativeImportedRun } from './support/e2e-data';

test.describe('Page Route Smoke', () => {
	test('dashboard, runs, and history route shells load', async ({ page }) => {
		const runCase = representativeImportedRun(requireManifest());

		const dashboardPage = new DashboardPage(page);
		await dashboardPage.goto(runCase.expectedRun.dashboardDate);
		await dashboardPage.expectRunIdVisible(runCase.runId);

		const runsPage = new RunsPage(page);
		await runsPage.gotoForDate(runCase.expectedRun.dashboardDate);
		await runsPage.expectReady();

		const historyPage = new HistoryPage(page);
		await historyPage.goto();
		await historyPage.expectReady();
	});

	test('admin config and import route shells load', async ({ page }) => {
		await new ConfigPage(page).goto();
		await new ImportPage(page).goto();
	});

	test('help FAQ and packet analyzer validation routes load', async ({
		page
	}) => {
		await page.goto('help/faq');
		await expect(page).toHaveURL(/\/help\/faq/);
		await expect(page.getByText(/FAQ|Deploy|Version/i).first()).toBeVisible({
			timeout: 15_000
		});

		await page.goto('tools/packet-viewer');
		await expect(page.getByText('Invalid URL Parameters')).toBeVisible({
			timeout: 15_000
		});
	});

	test('unknown route shows not found page', async ({ page }) => {
		await page.goto('definitely-not-a-bublik-page');
		await expect(page).toHaveURL(/\/definitely-not-a-bublik-page/);
		await expect(page.getByText(/not found/i).first()).toBeVisible({
			timeout: 15_000
		});
	});
});
