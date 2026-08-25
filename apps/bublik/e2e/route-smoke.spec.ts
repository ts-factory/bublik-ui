/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';

import { ConfigPage } from './pages/config-page';
import { DashboardPage } from './pages/dashboard-page';
import { HistoryPage } from './pages/history-page';
import { ImportPage } from './pages/import-page';
import { RunsPage } from './pages/runs-page';
import { RunPage } from './pages/run-page';
import { Sidebar } from './pages/sidebar';
import { LogPage } from './pages/log-page';
import { requireManifest } from './support/manifest';
import { projectIdByName, representativeImportedRun } from './support/e2e-data';
import { requireCapability } from './support/capabilities';
import { SIDEBAR_ALIASES, sidebarState } from './support/sidebar-state';
import { urlParams } from './support/url-params';
import { and, given, then, when } from './support/gherkin';
import { pressMod } from './support/hotkeys';

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
			await pressMod(page, 'KeyK');
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

	test('The sidebar shows the deployed versions', async ({ page }) => {
		const dashboardPage = new DashboardPage(page);
		const sidebar = new Sidebar(page);

		await given('I open the dashboard', () => dashboardPage.goto());
		await when('I hover the version next to the Bublik label', () =>
			sidebar.versionLabel().hover()
		);
		await then('the deployed UI and API versions are shown', () =>
			sidebar.expectDeployInfoOnHover()
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

	test(
		'The selected project follows me between the main pages',
		{ tag: ['@url-params'] },
		async ({ page, request }) => {
			const dashboardPage = new DashboardPage(page);
			const runsPage = new RunsPage(page);
			const historyPage = new HistoryPage(page);
			const runCase = representativeImportedRun(requireManifest());
			let projectId = '';

			await given('I open the dashboard scoped to one project', async () => {
				projectId = String(
					requireCapability(
						await projectIdByName(request, runCase.bundle.project),
						`Project "${runCase.bundle.project}" is not registered.`
					)
				);

				await dashboardPage.gotoWithParams({
					main: runCase.expectedRun.dashboardDate,
					mode: 'rows',
					project: projectId
				});
				await dashboardPage.expectRunIdVisible(runCase.runId);
			});
			await when(
				'I move to the runs page and then to the history page',
				async () => {
					await page.getByRole('link', { name: 'Runs', exact: true }).click();
					await runsPage.expectParams({ project: projectId });
					await page
						.getByRole('link', { name: 'History', exact: true })
						.click();
					await historyPage.expectReady();
				}
			);
			await then('each page is still scoped to that project', () =>
				historyPage.expectParams({ project: projectId })
			);
		}
	);

	test(
		'The compressed sidebar state remembers the run I was last looking at',
		{ tag: ['@url-params'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const runCase = representativeImportedRun(requireManifest());
			const sidebar = sidebarState(page);

			await given("I open an imported run's page", async () => {
				await runPage.goto(runCase.runId);
				await runPage.expectLoaded(runCase.expectedRun.name);
			});
			await when('I move to the dashboard', async () => {
				await page
					.getByRole('link', { name: 'Dashboard', exact: true })
					.click();
				await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
			});
			await then('the compressed sidebar state names that run', () =>
				sidebar.expectAlias(SIDEBAR_ALIASES.currentRunId, String(runCase.runId))
			);
			await and('it decodes at the version the app writes', () =>
				sidebar.expectVersion()
			);
		}
	);

	test(
		'The compressed sidebar state stays inside its length budget',
		{ tag: ['@url-params'] },
		async ({ page }) => {
			const dashboardPage = new DashboardPage(page);
			const runsPage = new RunsPage(page);
			const runPage = new RunPage(page);
			const logPage = new LogPage(page);
			const runCase = representativeImportedRun(requireManifest());
			const sidebar = sidebarState(page);

			await given(
				'I visit the dashboard, the runs page, a run and its log in turn',
				async () => {
					await dashboardPage.goto(runCase.expectedRun.dashboardDate);
					await dashboardPage.expectRunIdVisible(runCase.runId);
					await sidebar.expectWithinBudget();

					await runsPage.gotoForDate(runCase.expectedRun.dashboardDate);
					await runsPage.expectTableLoaded();
					await sidebar.expectWithinBudget();

					await runPage.goto(runCase.runId);
					await runPage.expectLoaded(runCase.expectedRun.name);
					await sidebar.expectWithinBudget();

					await logPage.goto(runCase.runId, 'mode=treeAndinfoAndlog');
					await logPage.expectLoaded();
				}
			);
			await then(
				'the compressed sidebar state is never longer than its budget',
				() => sidebar.expectWithinBudget()
			);
		}
	);

	test(
		'Hiding the sidebar through the URL survives moving between pages',
		{ tag: ['@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			const url = urlParams(page);

			await given('I open the dashboard with the sidebar hidden', async () => {
				await page.goto('dashboard?hide-sidebar=1');
				await expect(page.locator('#sidebar')).toHaveCount(0, {
					timeout: 30_000
				});
			});
			await when('I move to the runs page', async () => {
				await runsPage.gotoWithParams({ 'hide-sidebar': '1', mode: 'table' });
				await runsPage.expectReady();
			});
			await then('no sidebar is shown', () =>
				expect(page.locator('#sidebar')).toHaveCount(0, { timeout: 30_000 })
			);
			await and('the URL still hides the sidebar', () =>
				url.expect({ 'hide-sidebar': '1' })
			);
		}
	);
});
