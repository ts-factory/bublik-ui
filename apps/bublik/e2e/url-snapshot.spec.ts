/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

import { ConfigPage } from './pages/config-page';
import { DashboardPage } from './pages/dashboard-page';
import { HistoryPage } from './pages/history-page';
import { ImportPage } from './pages/import-page';
import { LogPage } from './pages/log-page';
import { MeasurementsPage } from './pages/measurements-page';
import { RunDiffPage } from './pages/run-diff-page';
import { RunMultiplePage } from './pages/run-multiple-page';
import { RunPage } from './pages/run-page';
import { RunReportPage } from './pages/run-report-page';
import { RunsPage } from './pages/runs-page';
import { Sidebar } from './pages/sidebar';
import { requireCapability } from './support/capabilities';
import {
	firstMeasurementResultNode,
	firstReportConfig,
	firstResultNode,
	importedRunId,
	paginatedLogNode,
	projectIdByName,
	reportFixture,
	representativeImportedRun
} from './support/e2e-data';
import { and, then, when } from './support/gherkin';
import { pressMod } from './support/hotkeys';
import { requireManifest } from './support/manifest';
import {
	historyDateRange,
	historyTestPathForProject,
	representativeNokRun,
	runPairOnSameDate
} from './support/sample-cases';
import { urlSnapshot } from './support/url-snapshot';

const TAG = { tag: ['@url-snapshot'] };

const VERIFY = 'every address, link and write matches the recorded snapshot';

const VERIFY_READ_ONLY = 'every address and link matches the recorded snapshot';

/**
 * The chart selection popover opens itself when the first chart is added and
 * remembers that, so its trigger is clicked only when it is closed. Its
 * "Stacked" action switches the page to the overlay layout.
 */
async function openStackedFromSelection(page: Page): Promise<void> {
	const trigger = page.getByRole('button', { name: /\d+ charts? selected/ });

	await expect(trigger).toBeVisible({ timeout: 15_000 });
	if ((await trigger.getAttribute('data-state')) !== 'open') {
		await trigger.click();
	}

	await expect(trigger).toHaveAttribute('data-state', 'open', {
		timeout: 15_000
	});
	await page.getByRole('button', { name: 'Stacked', exact: true }).click();
	await expect(page).toHaveURL(/mode=overlay/, { timeout: 15_000 });
}

test.describe('URL snapshot', () => {
	test(
		'The shell routes match the recorded URL snapshot',
		TAG,
		async ({ page, request }, testInfo) => {
			const snapshot = urlSnapshot(page, 'shell', testInfo);
			const manifest = requireManifest();
			const runCase = representativeImportedRun(manifest);
			const projectId = requireCapability(
				await projectIdByName(request, runCase.bundle.project),
				`Project "${runCase.bundle.project}" is not registered.`
			);
			// Any absolute URL satisfies the page's schema; a fixed one keeps the
			// snapshot free of the stack's host.
			const fileUrl = encodeURIComponent(
				'https://logs.example.invalid/e2e/run.pcap'
			);

			await when(
				'I open the root address, an unknown address, the hidden-sidebar and settings variants of the dashboard, the help page, the bare admin page, the legacy admin issues addresses, the chat page and the packet viewer',
				async () => {
					await snapshot.visit('root', () => page.goto('./'), { links: false });
					await snapshot.visit('not-found', () =>
						page.goto('definitely-not-a-bublik-page')
					);
					await snapshot.visit('dashboard-hide-sidebar', () =>
						page.goto('dashboard?hide-sidebar=1')
					);
					await snapshot.visit('dashboard-settings', () =>
						page.goto('dashboard?settings-open=1&settings-tab=appearance')
					);
					await snapshot.visit('help-faq', () => page.goto('help/faq'));
					await snapshot.visit('admin-bare', () => page.goto('admin'));
					await snapshot.visit(
						'admin-issues-legacy',
						() => page.goto(`admin/issues?project=${projectId}#top`),
						{ links: false }
					);
					await snapshot.visit(
						'admin-issues-rules-legacy',
						() => page.goto('admin/issues/rules'),
						{ links: false }
					);
					await snapshot.visit('chat', () => page.goto('chat'));
					await snapshot.visit('packet-viewer-missing-file', () =>
						page.goto('tools/packet-viewer')
					);
					await snapshot.visit('packet-viewer', () =>
						page.goto(
							`tools/packet-viewer?fileUrl=${fileUrl}&runId=${runCase.runId}&resultId=1`
						)
					);
				}
			);
			await and(
				'I navigate with the command palette and open a settings section',
				async () => {
					const dashboardPage = new DashboardPage(page);
					const sidebar = new Sidebar(page);

					await snapshot.visit(
						'dashboard-for-palette',
						() => dashboardPage.goto(),
						{ links: false }
					);
					await snapshot.write('command-palette-runs', async () => {
						await pressMod(page, 'KeyK');
						await page
							.getByPlaceholder('Type a command or search...')
							.waitFor({ state: 'visible', timeout: 15_000 });
						await page.getByRole('option', { name: 'Runs' }).click();
						await expect(page).toHaveURL(/\/runs(?:$|\?)/, {
							timeout: 15_000
						});
					});
					await snapshot.write('settings-appearance', async () => {
						await sidebar.openAccountMenu();
						await sidebar.accountMenuItem('Appearance').click();
						await expect(sidebar.settingsDialog()).toBeVisible({
							timeout: 15_000
						});
					});
				}
			);
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The auth routes match the recorded URL snapshot',
		TAG,
		async ({ page }, testInfo) => {
			const snapshot = urlSnapshot(page, 'auth', testInfo);

			await when(
				'I open the login page with and without a return address, the forgot page, a password reset link and an activation link',
				async () => {
					await snapshot.visit('login', () => page.goto('auth/login'));
					await snapshot.visit('login-redirect-url', () =>
						page.goto(
							`auth/login?redirect_url=${encodeURIComponent(
								'https://bublik.example.invalid/v2/runs?mode=charts'
							)}`
						)
					);
					await snapshot.visit('forgot', () => page.goto('auth/forgot'));
					await snapshot.visit('password-reset', () =>
						page.goto('auth/forgot_password/password_reset/42/reset-token')
					);
					await snapshot.visit('activation', () =>
						page.goto('auth/register/activate/42/activation-token/')
					);
				}
			);
			await then(VERIFY_READ_ONLY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The dashboard matches the recorded URL snapshot',
		TAG,
		async ({ page }, testInfo) => {
			const snapshot = urlSnapshot(page, 'dashboard', testInfo);
			const dashboardPage = new DashboardPage(page);
			const runCase = representativeImportedRun(requireManifest());
			const date = runCase.expectedRun.dashboardDate;
			const legacyDates = Buffer.from(JSON.stringify({ main: date })).toString(
				'base64'
			);

			await when(
				'I open the dashboard plain, for a fixture date, in columns mode, in TV mode and through a legacy dates link',
				async () => {
					await snapshot.visit('plain', () => dashboardPage.goto(), {
						links: false
					});
					await snapshot.visit('date-rows', () =>
						dashboardPage.goto(date, { mode: 'rows' })
					);
					await snapshot.visit('columns', () =>
						dashboardPage.goto(date, { mode: 'columns' })
					);
					await snapshot.visit('tv', () =>
						dashboardPage.gotoWithParams({ main: date, tv: '1' })
					);
					await snapshot.visit('legacy-dates', () =>
						page.goto(`dashboard?dates=${legacyDates}`)
					);
				}
			);
			await and(
				'I change the mode, search, switch auto reload, enter and leave TV mode and press Today',
				async () => {
					await snapshot.visit('before-writes', () =>
						dashboardPage.goto(date, { mode: 'rows' })
					);
					await dashboardPage.expectRunIdVisible(runCase.runId);
					await snapshot.write('set-mode-columns', () =>
						dashboardPage.setMode('columns')
					);
					await snapshot.write('search', () => dashboardPage.search('abc'));
					await snapshot.write('clear-search', () =>
						dashboardPage.clearSearch()
					);
					await snapshot.write('auto-reload-on', () =>
						dashboardPage.setAutoReload(true)
					);
					await snapshot.write('auto-reload-off', () =>
						dashboardPage.setAutoReload(false)
					);
					await snapshot.write('enter-tv', () => dashboardPage.enterTvMode());
					await snapshot.write('leave-tv', () => dashboardPage.leaveTvMode());
					await snapshot.write('today', () => dashboardPage.clickToday());
				}
			);
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The runs list matches the recorded URL snapshot',
		TAG,
		async ({ page }, testInfo) => {
			const snapshot = urlSnapshot(page, 'runs', testInfo);
			const runsPage = new RunsPage(page);
			const manifest = requireManifest();
			const runCase = representativeImportedRun(manifest);
			const date = runCase.expectedRun.dashboardDate;
			const pair = requireCapability(
				runPairOnSameDate(manifest),
				'two imported runs on the same date and project'
			);
			const [firstRunId, secondRunId] = pair.bundles.map(importedRunId);

			await when(
				'I open the runs list plain, for a fixture date, in charts and progress mode and with a tag expression',
				async () => {
					await snapshot.visit('plain', () => runsPage.goto(), {
						links: false
					});
					await snapshot.visit('date', () => runsPage.gotoForDate(date));
					await snapshot.visit('charts', () => runsPage.gotoWithMode('charts'));
					await snapshot.visit('progress', () =>
						runsPage.gotoWithMode('progress')
					);
					await snapshot.visit('tag-expr', () =>
						runsPage.gotoWithTagExpr('linux')
					);
				}
			);
			await and(
				'I submit and reset the filter form and select two runs',
				async () => {
					await snapshot.visit('before-writes', () =>
						runsPage.gotoForDate(pair.date)
					);
					await runsPage.expectTableLoaded();
					await snapshot.write('submit-tag-expr', async () => {
						await runsPage.fillTagExpr('linux');
						await runsPage.submit();
					});
					await snapshot.write('reset-form', () => runsPage.resetForm());
					await snapshot.visit('after-reset', () =>
						runsPage.gotoForDate(pair.date)
					);
					await runsPage.expectTableLoaded();
					await snapshot.write('select-two-runs', async () => {
						await runsPage.selectRow(firstRunId);
						await runsPage.selectRow(secondRunId);
						await runsPage.expectSelectedCount(2);
					});
					await snapshot.visit('selection-popover', async () => {
						await runsPage.openSelectionPopover();
						await runsPage.expectMultipleOffered([firstRunId, secondRunId]);
					});
					await snapshot.write('clear-selection', () =>
						runsPage.clearSelection()
					);
				}
			);
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The compare and multiple pages match the recorded URL snapshot',
		TAG,
		async ({ page }, testInfo) => {
			const snapshot = urlSnapshot(page, 'compare-multiple', testInfo);
			const comparePage = new RunDiffPage(page);
			const multiplePage = new RunMultiplePage(page);
			const pair = requireCapability(
				runPairOnSameDate(requireManifest()),
				'two imported runs on the same date and project'
			);
			const [leftRunId, rightRunId] = pair.bundles.map(importedRunId);

			await when(
				'I open the compare page with and without a pair and the multiple page with and without pinned runs',
				async () => {
					await snapshot.visit('compare', () =>
						comparePage.goto(leftRunId, rightRunId)
					);
					await snapshot.visit('compare-missing', () => comparePage.goto());
					await snapshot.visit('multiple', () =>
						multiplePage.goto([leftRunId, rightRunId], leftRunId)
					);
					await snapshot.visit('multiple-missing', () => multiplePage.goto([]));
				}
			);
			await and(
				'I expand a diff row, show the info diff and select another pinned run',
				async () => {
					await snapshot.visit('compare-before-writes', () =>
						comparePage.goto(leftRunId, rightRunId)
					);
					await comparePage.expectLoaded();
					await snapshot.write('toggle-first-row', () =>
						comparePage.toggleFirstRow()
					);
					await snapshot.write('show-info-diff', () =>
						comparePage.showInfoDiff()
					);
					await snapshot.visit('multiple-before-writes', () =>
						multiplePage.goto([leftRunId, rightRunId])
					);
					await multiplePage.expectLoaded();
					await snapshot.write('select-run', () =>
						multiplePage.selectRun(rightRunId)
					);
				}
			);
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The run page matches the recorded URL snapshot',
		TAG,
		async ({ page, request }, testInfo) => {
			const snapshot = urlSnapshot(page, 'run', testInfo);
			const runPage = new RunPage(page);
			const manifest = requireManifest();
			const runCase = representativeImportedRun(manifest);
			const result = requireCapability(
				await firstResultNode(request, runCase),
				`Run ${runCase.runId} has no test result in its tree.`
			);
			const nokRun = requireCapability(
				representativeNokRun(manifest),
				'a run with an unexpected or abnormal result'
			);
			const nokRunId = importedRunId(nokRun.bundle);

			await when(
				'I open a run plain, at a target iteration, with a result filter and through a legacy plain-JSON expanded link',
				async () => {
					await snapshot.visit('plain', () => runPage.goto(runCase.runId));
					await snapshot.visit('target-iteration', () =>
						runPage.gotoWithParams(runCase.runId, {
							targetIterationId: String(result.node.id)
						})
					);
					await snapshot.visit('result-filter', () =>
						runPage.gotoWithParams(runCase.runId, {
							resultFilter: 'UNEXPECTED_TOTAL'
						})
					);
					await snapshot.visit('legacy-expanded', () =>
						runPage.gotoWithParams(runCase.runId, {
							expanded: JSON.stringify({ '0': true })
						})
					);
				}
			);
			await and('I expand a package and preview NOK results', async () => {
				await snapshot.visit('before-writes', () => runPage.goto(nokRunId));
				await runPage.expectLoaded(nokRun.expectedRun.name);
				await snapshot.write('toggle-first-package', async () => {
					await runPage.toggleTreeNode(runPage.packageRows().first());
				});
				await snapshot.write('preview-nok', () => runPage.previewNok());
			});
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The log page matches the recorded URL snapshot',
		TAG,
		async ({ page, request }, testInfo) => {
			const snapshot = urlSnapshot(page, 'log', testInfo);
			const logPage = new LogPage(page);
			const manifest = requireManifest();
			const runCase = representativeImportedRun(manifest);
			const result = requireCapability(
				await firstResultNode(request, runCase),
				`Run ${runCase.runId} has no test result in its tree.`
			);
			await when(
				"I open a run's log plain, in each layout mode, focused on a result, through the legacy two-segment address and in legacy rendering",
				async () => {
					await snapshot.visit('plain', () => logPage.goto(runCase.runId));
					for (const mode of [
						'treeAndinfoAndlog',
						'treeAndlog',
						'infoAndlog',
						'log'
					]) {
						await snapshot.visit(`mode-${mode}`, () =>
							logPage.goto(runCase.runId, `mode=${mode}`)
						);
					}
					await snapshot.visit('focused', () =>
						logPage.goto(
							runCase.runId,
							`focusId=${result.node.id}&mode=treeAndinfoAndlog`
						)
					);
					await snapshot.visit('legacy-two-segment', () =>
						page.goto(`log/${runCase.runId}/0?focusId=${result.node.id}`)
					);
					await snapshot.visit('legacy-renderer', () =>
						logPage.goto(runCase.runId, 'legacy=true&mode=treeAndinfoAndlog')
					);
				}
			);
			await and(
				'I focus a result, return to the run log and toggle the legacy renderer',
				async () => {
					await snapshot.visit('before-writes', () =>
						logPage.goto(runCase.runId, 'mode=treeAndinfoAndlog')
					);
					await logPage.expectLoaded();
					await snapshot.write('focus-result', () =>
						logPage.focusTreeItem(result.node.id)
					);
					await snapshot.write('show-run-log', () => logPage.showRunLog());
					await snapshot.write('toggle-legacy-on', () =>
						logPage.toggleLegacyLog()
					);
					await snapshot.write('toggle-legacy-off', () =>
						logPage.toggleLegacyLog()
					);
				}
			);
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The log content writes match the recorded URL snapshot',
		{ tag: ['@url-snapshot', '@needs-log-pagination'] },
		async ({ page, request }, testInfo) => {
			const snapshot = urlSnapshot(page, 'log-content', testInfo);
			const logPage = new LogPage(page);
			const manifest = requireManifest();
			const runCase = representativeImportedRun(manifest);
			const result = requireCapability(
				await firstResultNode(request, runCase),
				`Run ${runCase.runId} has no test result in its tree.`
			);
			const paginated = requireCapability(
				await paginatedLogNode(request, manifest),
				'a result whose log spans several pages'
			);

			await when(
				"I open a result's log and bookmark a line, then open a paginated log and move between its pages",
				async () => {
					await snapshot.visit('focused-json-log', () =>
						logPage.goto(runCase.runId, `focusId=${result.node.id}`)
					);
					await logPage.expectJsonLogVisible();
					await snapshot.write('bookmark-first-line', async () => {
						await logPage.bookmarkFirstLine();
					});
					await snapshot.visit('paginated', () =>
						logPage.goto(
							paginated.runCase.runId,
							`focusId=${paginated.node.id}&mode=treeAndlog`
						)
					);
					await logPage.expectLoaded();
					await snapshot.write('open-page-2', () => logPage.openPage(2));
					await snapshot.write('open-page-1', () => logPage.openPage(1));
				}
			);
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The run report matches the recorded URL snapshot',
		TAG,
		async ({ page }, testInfo) => {
			const snapshot = urlSnapshot(page, 'report', testInfo);
			const reportPage = new RunReportPage(page);
			const fixture = await reportFixture(page, requireManifest());
			const anchor = fixture.argValItems[0]?.id ?? fixture.testBlocks[0].id;

			await when(
				'I open a report with its config, without a config, through the trailing-slash link and at an anchor',
				async () => {
					await snapshot.visit('with-config', () =>
						reportPage.goto(fixture.runId, fixture.configId)
					);
					await snapshot.visit('missing-config', () =>
						reportPage.goto(fixture.runId)
					);
					await snapshot.visit('trailing-slash', () =>
						page.goto(
							`runs/${fixture.runId}/report/?config=${fixture.configId}`
						)
					);
					await snapshot.visit('anchor', () =>
						reportPage.goto(fixture.runId, fixture.configId, { hash: anchor })
					);
				}
			);
			await and(
				'I open a table-of-contents entry, collapse a block and step to the next block',
				async () => {
					await snapshot.visit('before-writes', () =>
						reportPage.goto(fixture.runId, fixture.configId)
					);
					await reportPage.expectLoaded();
					await snapshot.write('open-toc-entry', () =>
						reportPage.openTocEntry(anchor)
					);
					await snapshot.write('collapse-test-block', () =>
						reportPage.toggleTocEntry(fixture.testBlocks[0].id)
					);
					await snapshot.write('expand-test-block', () =>
						reportPage.toggleTocEntry(fixture.testBlocks[0].id)
					);
					await snapshot.write('next-arg-val-block', () =>
						reportPage.pressNextArgValBlock()
					);
				}
			);
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The measurements page matches the recorded URL snapshot',
		TAG,
		async ({ page, request }, testInfo) => {
			const snapshot = urlSnapshot(page, 'measurements', testInfo);
			const measurementsPage = new MeasurementsPage(page);
			const result = requireCapability(
				await firstMeasurementResultNode(request, requireManifest()),
				'a result with measurements'
			);
			const runId = result.runCase.runId;
			const resultId = result.node.id;

			await when(
				"I open a result's measurements plain, in default mode and in overlay mode",
				async () => {
					await snapshot.visit('plain', () =>
						measurementsPage.goto(runId, resultId)
					);
					await snapshot.visit('default', () =>
						measurementsPage.goto(runId, resultId, 'mode=default')
					);
					await snapshot.visit('overlay', () =>
						measurementsPage.goto(runId, resultId, 'mode=overlay')
					);
				}
			);
			await and(
				'I add a chart to the selection and open the overlay',
				async () => {
					await snapshot.visit('before-writes', () =>
						measurementsPage.goto(runId, resultId, 'mode=default')
					);
					await measurementsPage.expectLoaded();
					await snapshot.write('select-first-chart', async () => {
						await measurementsPage.selectChart(0);
					});
					await snapshot.write('select-second-chart', async () => {
						await measurementsPage.selectChart(1);
					});
					await snapshot.write('open-overlay', () =>
						openStackedFromSelection(page)
					);
				}
			);
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The history page matches the recorded URL snapshot',
		TAG,
		async ({ page }, testInfo) => {
			const snapshot = urlSnapshot(page, 'history', testInfo);
			const historyPage = new HistoryPage(page);
			const manifest = requireManifest();
			const runCase = representativeImportedRun(manifest);
			const testPath = requireCapability(
				historyTestPathForProject(manifest, runCase.bundle.project),
				`Project "${runCase.bundle.project}" has no sampled test path.`
			);
			const dates = historyDateRange(manifest);
			const params = new URLSearchParams({ testName: testPath, ...dates });

			await when(
				'I open history plain, for a fixture test path in each mode and through the v2 alias',
				async () => {
					await snapshot.visit('plain', () => historyPage.goto());
					for (const mode of [
						'linear',
						'aggregation',
						'measurements',
						'measurements-by-iteration',
						'measurements-combined'
					]) {
						await snapshot.visit(`mode-${mode}`, () =>
							historyPage.gotoWithTestPath(testPath, { ...dates, mode })
						);
					}
					await snapshot.visit('v2-alias', () =>
						page.goto(`history/v2?${params.toString()}`)
					);
				}
			);
			await and('I submit the global search form', async () => {
				await snapshot.visit('before-writes', () =>
					historyPage.gotoWithTestPath(testPath, { ...dates, mode: 'linear' })
				);
				await historyPage.expectReady();
				await snapshot.write('submit-search', () =>
					historyPage.searchForTestPath(testPath)
				);
			});
			await then(VERIFY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The issues pages match the recorded URL snapshot',
		TAG,
		async ({ page, request }, testInfo) => {
			const snapshot = urlSnapshot(page, 'issues', testInfo);
			const runCase = representativeImportedRun(requireManifest());
			const response = await request.get('/api/v2/issues/?page_size=100');
			expect(response.ok()).toBeTruthy();
			const payload = (await response.json()) as { results: { id: number }[] };
			// The oldest issue: the seeded ones outlive whatever the suite creates.
			const issueId = requireCapability(
				payload.results.map((issue) => issue.id).sort((a, b) => a - b)[0],
				'a classification issue on the instance'
			);

			await when(
				"I open the issues list, the rules list, an issue and a run's issues",
				async () => {
					await snapshot.visit('issues', () => page.goto('issues'), {
						links: false
					});
					await snapshot.visit('rules', () => page.goto('issues/rules'), {
						links: false
					});
					await snapshot.visit('issue', () => page.goto(`issues/${issueId}`));
					await snapshot.visit('run-issues', () =>
						page.goto(`runs/${runCase.runId}/issues`)
					);
				}
			);
			await then(VERIFY_READ_ONLY, () => snapshot.verify(testInfo));
		}
	);

	test(
		'The admin pages match the recorded URL snapshot',
		TAG,
		async ({ page }, testInfo) => {
			const snapshot = urlSnapshot(page, 'admin', testInfo);
			const configPage = new ConfigPage(page);
			const importPage = new ImportPage(page);
			const fixture = await reportFixture(page, requireManifest());
			const config = requireCapability(
				await firstReportConfig(page, fixture.runId),
				`Run ${fixture.runId} has no report config.`
			);

			await when(
				'I open the import, config, users, flower and analytics pages with and without their parameters',
				async () => {
					await snapshot.visit('import', () => importPage.goto(), {
						links: false
					});
					await snapshot.visit('config', () => configPage.goto());
					await snapshot.visit('config-selected', () =>
						configPage.gotoConfig(config.id)
					);
					await snapshot.visit('users', () => page.goto('admin/users'));
					await snapshot.visit('flower', () => page.goto('admin/flower'));
					await snapshot.visit(
						'analytics',
						() => page.goto('admin/analytics'),
						{ links: false }
					);
					await snapshot.visit(
						'analytics-filtered',
						() =>
							page.goto(
								'admin/analytics?page=2&page_size=200&event_type=page_view'
							),
						{ links: false }
					);
				}
			);
			await then(VERIFY_READ_ONLY, () => snapshot.verify(testInfo));
		}
	);
});
