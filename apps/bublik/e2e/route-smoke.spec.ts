/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/navigation.feature */
/* Assertions are encapsulated by the page objects. */
/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test';

import { ConfigPage } from './pages/config-page';
import { DashboardPage } from './pages/dashboard-page';
import { HistoryPage } from './pages/history-page';
import { ImportPage } from './pages/import-page';
import { RunsPage } from './pages/runs-page';
import { requireManifest } from './support/manifest';
import { representativeImportedRun } from './support/e2e-data';
import { given, then, when } from './support/gherkin';

test.describe('Navigation', () => {
	test(
		'The root address opens the dashboard',
		{ tag: ['@smoke'] },
		async ({ page }) => {
			await when('I open the root address', () => page.goto('./'));
			await then('the dashboard is open', () =>
				expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
			);
		}
	);

	test(
		'The main pages load their shells',
		{ tag: ['@smoke'] },
		async ({ page }) => {
			const runCase = representativeImportedRun(requireManifest());
			const dashboardPage = new DashboardPage(page);
			const runsPage = new RunsPage(page);
			const historyPage = new HistoryPage(page);

			await when('I open the dashboard for a fixture date', () =>
				dashboardPage.goto(runCase.expectedRun.dashboardDate)
			);
			await then('the run of that date is listed', () =>
				dashboardPage.expectRunIdVisible(runCase.runId)
			);
			await when('I open the runs page for that date', () =>
				runsPage.gotoForDate(runCase.expectedRun.dashboardDate)
			);
			await then('the runs filter form is ready', () => runsPage.expectReady());
			await when('I open the history page', () => historyPage.goto());
			await then('the history page is ready', () => historyPage.expectReady());
		}
	);

	test(
		'The admin pages load their shells',
		{ tag: ['@smoke'] },
		async ({ page }) => {
			const configPage = new ConfigPage(page);
			const importPage = new ImportPage(page);

			await when('I open the configuration page', () => configPage.goto());
			await then('the configuration page is ready', () =>
				expect(configPage.newProjectButton).toBeVisible()
			);
			await when('I open the import page', () => importPage.goto());
			await then('the import page is ready', () =>
				expect(importPage.importButton).toBeVisible()
			);
		}
	);

	test('The command palette navigates to a main page', async ({ page }) => {
		const dashboardPage = new DashboardPage(page);

		await given('I open the dashboard', () => dashboardPage.goto());
		await when('I open the command palette and choose Runs', async () => {
			await page.keyboard.press('ControlOrMeta+KeyK');
			await page
				.getByPlaceholder('Type a command or search...')
				.waitFor({ state: 'visible', timeout: 15_000 });
			await page.getByRole('option', { name: 'Runs' }).click();
		});
		await then('the runs page is open', () =>
			expect(page).toHaveURL(/\/runs(?:$|\?)/, { timeout: 15_000 })
		);
	});

	test('The sidebar can be hidden through the URL', async ({ page }) => {
		await when('I open the dashboard with the sidebar hidden', () =>
			page.goto('dashboard?hide-sidebar=1')
		);
		await then('no sidebar is shown', () =>
			expect(page.locator('#sidebar')).toHaveCount(0, { timeout: 30_000 })
		);
	});

	test('An unknown address shows the not-found page', async ({ page }) => {
		await when('I open an address that does not exist', () =>
			page.goto('definitely-not-a-bublik-page')
		);
		await then('the not-found page is shown', async () => {
			await expect(page).toHaveURL(/\/definitely-not-a-bublik-page/);
			await expect(page.getByText(/not found/i).first()).toBeVisible({
				timeout: 15_000
			});
		});
	});
});
