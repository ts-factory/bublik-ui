/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';

import { ConfigPage } from './pages/config-page';
import { DashboardPage } from './pages/dashboard-page';
import { HistoryPage } from './pages/history-page';
import { ImportPage } from './pages/import-page';
import { IssuePage } from './pages/issue-page';
import { IssueRulesPage } from './pages/issue-rules-page';
import { IssuesPage } from './pages/issues-page';
import { RunIssuesPage } from './pages/run-issues-page';
import { RunsPage } from './pages/runs-page';
import { RunPage } from './pages/run-page';
import { Sidebar } from './pages/sidebar';
import { LogPage } from './pages/log-page';
import { requireManifest } from './support/manifest';
import { projectIdByName, representativeImportedRun } from './support/e2e-data';
import { requireCapability } from './support/capabilities';
import { IssueCleanup } from './support/classification';
import { SIDEBAR_ALIASES, sidebarState } from './support/sidebar-state';
import { urlParams } from './support/url-params';
import { and, given, then, when } from './support/gherkin';
import { pressMod } from './support/hotkeys';

const issueCleanup = new IssueCleanup('navigation');

test.describe('Navigation', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await issueCleanup.sweep(request);
	});

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
		await and('a release version opens its release notes in a new tab', () =>
			sidebar.expectVersionLinksToReleaseNotes()
		);
	});

	test('The account menu in the sidebar opens a settings section', async ({
		page
	}) => {
		const dashboardPage = new DashboardPage(page);
		const sidebar = new Sidebar(page);

		await given('I open the dashboard', () => dashboardPage.goto());
		await and('the sidebar shows who I am signed in as', () =>
			sidebar.expectSignedIn()
		);
		await when('I open my account menu and choose Appearance', () =>
			sidebar
				.openAccountMenu()
				.then(() => sidebar.accountMenuItem('Appearance').click())
		);
		await then(
			'the settings dialog is open on the Appearance section',
			async () => {
				await expect(sidebar.settingsDialog()).toBeVisible({ timeout: 15_000 });
				await expect(page).toHaveURL(/settings-open=1/);
				await expect(page).toHaveURL(/settings-tab=appearance/);
			}
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

	test(
		'The sidebar Issues submenu opens the issues and rules pages',
		{ tag: ['@issues'] },
		async ({ page }) => {
			const dashboardPage = new DashboardPage(page);
			const sidebar = new Sidebar(page);
			const issuesPage = new IssuesPage(page);
			const rulesPage = new IssueRulesPage(page);

			await given('I open the dashboard', () => dashboardPage.goto());
			await when('I open the Issues submenu and choose Issues', () =>
				sidebar.openIssuesSubmenu('Issues')
			);
			await then('the issues page is open', () => issuesPage.expectLoaded());
			await when('I open the Issues submenu and choose Rules', () =>
				sidebar.openIssuesSubmenu('Rules')
			);
			await then('the rules page is open', () => rulesPage.expectLoaded());
		}
	);

	test(
		'The command palette opens the issues page',
		{ tag: ['@issues'] },
		async ({ page }) => {
			const dashboardPage = new DashboardPage(page);
			const issuesPage = new IssuesPage(page);

			await given('I open the dashboard', () => dashboardPage.goto());
			await when('I open the command palette and choose Issues', async () => {
				await pressMod(page, 'KeyK');
				await page
					.getByPlaceholder('Type a command or search...')
					.waitFor({ state: 'visible', timeout: 15_000 });
				await page.getByRole('option', { name: 'Issues', exact: true }).click();
			});
			await then('the issues page is open', () => issuesPage.expectLoaded());
		}
	);

	test(
		'Old admin issue addresses redirect to the issues pages',
		{ tag: ['@issues'] },
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			const rulesPage = new IssueRulesPage(page);

			await when('I open the old admin issues address', () =>
				page.goto('admin/issues')
			);
			await then('the issues page is open', async () => {
				await expect(page).toHaveURL(/\/issues(?:$|\?)/, { timeout: 30_000 });
				await expect(page).not.toHaveURL(/\/admin\//);
				await issuesPage.expectLoaded();
			});
			await when('I open the old admin rules address', () =>
				page.goto('admin/issues/rules')
			);
			await then('the rules page is open', async () => {
				await expect(page).toHaveURL(/\/issues\/rules(?:$|\?)/, {
					timeout: 30_000
				});
				await expect(page).not.toHaveURL(/\/admin\//);
				await rulesPage.expectLoaded();
			});
		}
	);

	test(
		'The compressed sidebar state remembers the issues pages I visited',
		{ tag: ['@issues', '@url-params'] },
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			const rulesPage = new IssueRulesPage(page);
			const runIssuesPage = new RunIssuesPage(page);
			const sidebar = new Sidebar(page);
			const runCase = representativeImportedRun(requireManifest());
			const state = sidebarState(page);
			const search = 'remember-me';

			// Every move after the first is through the sidebar: the state lives
			// in the `_s` param, which a typed address does not carry.
			await given("I open a run's issues page", async () => {
				await runIssuesPage.goto(runCase.runId);
				await runIssuesPage.expectLoaded();
			});
			await and(
				'I move to the issues page, search it, and do the same on the rules page',
				async () => {
					await sidebar.openIssuesList();
					await issuesPage.expectLoaded();
					await issuesPage.table.search(search);
					await issuesPage.expectParams({ q: search });
					await sidebar.openIssuesSubmenu('Rules');
					await rulesPage.expectLoaded();
					// A bare pathname compacts to nothing and is left out of `_s`;
					// only a page with a query of its own is remembered.
					await rulesPage.table.search(search);
					await rulesPage.expectParams({ q: search });
				}
			);
			await when('I move to the dashboard', () => sidebar.openDashboard());
			await then(
				"the compressed sidebar state remembers the issues search, the rules page and the run's issues",
				async () => {
					await state.expectAliasCarries(
						SIDEBAR_ALIASES.issuesLastList,
						`q=${search}`
					);
					await state.expectAliasCarries(
						SIDEBAR_ALIASES.issuesLastRules,
						`q=${search}`
					);
					await state.expectAliasCarries(
						SIDEBAR_ALIASES.runLastIssues,
						`/runs/${runCase.runId}/issues`
					);
				}
			);
			await and(
				'it decodes at the version the app writes and stays inside its budget',
				async () => {
					await state.expectVersion();
					await state.expectWithinBudget();
				}
			);
		}
	);

	test(
		'The Issue sidebar link stays disabled until an issue was opened',
		{ tag: ['@issues', '@issues-write'] },
		async ({ page, request }) => {
			const dashboardPage = new DashboardPage(page);
			const issuesPage = new IssuesPage(page);
			const issuePage = new IssuePage(page);
			const sidebar = new Sidebar(page);
			const runCase = representativeImportedRun(requireManifest());
			const title = issueCleanup.title('sidebar');
			let projectId = 0;
			let issueId = 0;

			await given('I record an issue and open the dashboard', async () => {
				projectId = requireCapability(
					await projectIdByName(request, runCase.bundle.project),
					`Project "${runCase.bundle.project}" is not registered.`
				);
				await issuesPage.goto({ project: String(projectId) });
				await issuesPage.expectLoaded();
				issueId = await issuesPage.createIssue({ title });
				issueCleanup.register(issueId, projectId);
				await dashboardPage.goto();
			});
			await then('the Issue sidebar item is not a link', () =>
				sidebar.expectIssueLinkDisabled()
			);
			await when(
				"I open that issue's page and move to the dashboard",
				async () => {
					await issuePage.goto(issueId, { project: String(projectId) });
					await issuePage.expectLoaded(title);
					// Through the sidebar: a typed address drops the `_s` state that
					// remembers the issue.
					await sidebar.openDashboard();
				}
			);
			await then('the Issue sidebar item links to that issue', () =>
				sidebar.expectIssueLinkTo(issueId)
			);
			await and('I delete that issue', async () => {
				await issuesPage.goto({ project: String(projectId) });
				await issuesPage.expectLoaded();
				await issuesPage.table.search(title);
				await issuesPage.deleteIssue(title);
				issueCleanup.forget(issueId);
			});
		}
	);
});
