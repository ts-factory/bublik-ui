/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';

import { DashboardPage } from './pages/dashboard-page';
import { ProjectPicker } from './pages/project-picker';
import { RunPage } from './pages/run-page';
import {
	dashboardCellDestination,
	dashboardResolvedDate,
	importedRunId,
	projectIdByName
} from './support/e2e-data';
import { and, but, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';
import {
	expectedNokCount,
	projectSpanningDays,
	representativeNokRun,
	representativeRun,
	runPairOnDifferentProjects,
	shiftDate
} from './support/sample-cases';

test.use({ storageState: { cookies: [], origins: [] } });

function nokRun() {
	const representative = requireCapability(
		representativeNokRun(requireManifest()),
		'Fixture manifest contains no NOK samples.'
	);

	return {
		...representative,
		runId: importedRunId(representative.bundle),
		nokCount: expectedNokCount(representative.expectedRun)
	};
}

function anyRun() {
	const { bundle, expectedRun } = representativeRun(requireManifest());
	return { bundle, expectedRun, runId: importedRunId(bundle) };
}

test.describe('Dashboard', () => {
	test(
		'Dashboard lists the runs imported for a date',
		{ tag: ['@dashboard', '@smoke'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();

			await given('a run was imported for a day', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', () =>
				dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' })
			);
			await then('the run appears as a row in the dashboard table', () =>
				dashboard.expectRunIdVisible(runId)
			);
			await and(
				'the row shows its conclusion, total and NOK counters',
				async () => {
					await dashboard.expectCellVisible(runId, 'total');
					await dashboard.expectCellVisible(runId, 'unexpected');
				}
			);
		}
	);

	test(
		'Dashboard shows an empty state for a date without runs',
		{ tag: ['@dashboard'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const manifest = requireManifest();
			const emptyDate = requireCapability(
				manifest.emptyDates[0],
				'Fixture manifest contains no empty date.'
			);

			await given('a day with no imported runs', () =>
				expect(emptyDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', () =>
				dashboard.goto(emptyDate, { mode: 'rows' })
			);
			await then('the dashboard shows the "No data" empty state', () =>
				dashboard.expectEmpty()
			);
			await and('none of the imported runs are listed', async () => {
				for (const bundle of manifest.bundles) {
					await dashboard.expectRunIdHidden(importedRunId(bundle));
				}
			});
		}
	);

	test(
		'NOK counter reports the number of unexpected results',
		{ tag: ['@dashboard', '@needs-nok'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId, nokCount } = nokRun();

			await given('an imported run has unexpected results', () =>
				expect(nokCount).toBeGreaterThan(0)
			);
			await when("I open the dashboard for that run's day", () =>
				dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' })
			);
			await then(
				"the run's NOK counter equals the number of unexpected results",
				() => dashboard.expectCellValue(runId, 'unexpected', String(nokCount))
			);
		}
	);

	test(
		'Clicking the NOK counter opens the run with unexpected rows previewed',
		{ tag: ['@dashboard', '@needs-nok'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const runPage = new RunPage(page);
			const { expectedRun, runId, sampleNames } = nokRun();

			await given('an imported run has unexpected results', () =>
				expect(sampleNames.length).toBeGreaterThan(0)
			);
			await when("I open the dashboard for that run's day", () =>
				dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' })
			);
			await and("I click the run's NOK counter", () =>
				dashboard.openUnexpected(runId)
			);
			await then('the run page for that run is open', () =>
				runPage.expectLoaded(expectedRun.name)
			);
			await and('the packages containing unexpected results are expanded', () =>
				runPage.expectExpandedPackage()
			);
			await and('the tests with unexpected results are listed', async () => {
				for (const sampleName of sampleNames) {
					await expect(page.getByText(sampleName).first()).toBeVisible({
						timeout: 15_000
					});
				}
			});
			await but('no result table is expanded yet', () =>
				runPage.expectNoResultTable()
			);
		}
	);

	test(
		'Ctrl-clicking the NOK counter opens the run with the result tables expanded',
		{ tag: ['@dashboard', '@needs-nok'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const runPage = new RunPage(page);
			const { expectedRun, runId, sampleNames } = nokRun();

			await given('an imported run has unexpected results', () =>
				expect(sampleNames.length).toBeGreaterThan(0)
			);
			await when("I open the dashboard for that run's day", () =>
				dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' })
			);
			await and("I ctrl-click the run's NOK counter", () =>
				dashboard.openUnexpectedResults(runId)
			);
			await then('the run page for that run is open', () =>
				runPage.expectLoaded(expectedRun.name)
			);
			await and(
				'the result table of a test with unexpected results is expanded',
				() => runPage.expectResultTableVisible()
			);
		}
	);

	test(
		'Clicking the total counter follows the destination the dashboard declares',
		{ tag: ['@dashboard'] },
		async ({ page, request }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();
			let destination = /never/;

			await given(
				"the dashboard declares where the run's total counter leads",
				async () => {
					destination = requireCapability(
						await dashboardCellDestination(
							request,
							expectedRun.dashboardDate,
							runId,
							'total'
						),
						'Dashboard total cell declares no navigable destination.'
					);
				}
			);
			await when('I open the dashboard for that day', () =>
				dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' })
			);
			await and("I click the run's total counter", () =>
				dashboard.openCell(runId, 'total', destination)
			);
			await then('that declared destination is open', () =>
				expect(page).toHaveURL(destination)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		"Expanding a dashboard row reveals the run's pass rate history",
		{ tag: ['@dashboard'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();

			await given('a run was imported for a day', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', async () => {
				await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
				await dashboard.expectRunIdVisible(runId);
			});
			await and("I expand the run's row", () => dashboard.expandRow(runId));
			await then("the row's pass rate history is shown", () =>
				dashboard.expectSubrowVisible(runId)
			);
			await when("I collapse the run's row", () =>
				dashboard.collapseRow(runId)
			);
			await then("the row's pass rate history is hidden", () =>
				dashboard.expectSubrowHidden(runId)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Searching the dashboard narrows the table to matching runs',
		{ tag: ['@dashboard'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();

			await given('a run was imported for a day', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', async () => {
				await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
				await dashboard.expectRunIdVisible(runId);
			});
			await and('I search for a term that no run matches', () =>
				dashboard.search('no-run-matches-this-term')
			);
			await then('the run is no longer listed', () =>
				dashboard.expectRunIdHidden(runId)
			);
			await when('I clear the search', () => dashboard.clearSearch());
			await then('the run is listed again', () =>
				dashboard.expectRunIdVisible(runId)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Switching the layout mode shows two days side by side',
		{ tag: ['@dashboard'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();

			await given('a run was imported for a day', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', async () => {
				await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
				await dashboard.expectRunIdVisible(runId);
			});
			await and('I switch the layout to two days per column', () =>
				dashboard.setMode('columns')
			);
			await then('the dashboard URL records the columns mode', () =>
				expect(page).toHaveURL(/mode=columns/)
			);
			await and('the run is still listed', () =>
				dashboard.expectRunIdVisible(runId)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The Today button returns the dashboard to the current day',
		{ tag: ['@dashboard'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();

			await given('a run was imported for a day', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', async () => {
				await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
				await dashboard.expectRunIdVisible(runId);
			});
			await and('I press the Today button', () => dashboard.clickToday());
			await then('the dashboard URL no longer pins a date', () =>
				dashboard.expectDateNotPinned()
			);
		}
	);

	test(
		'The Today button opens the latest day of the selected project',
		{ tag: ['@dashboard'] },
		async ({ page, request }) => {
			const dashboard = new DashboardPage(page);
			const sample = requireCapability(
				projectSpanningDays(requireManifest()),
				'Fixture manifest contains no project with runs on more than one day.'
			);
			let projectId = 0;

			await given('a project whose runs span more than one day', async () => {
				projectId = requireCapability(
					await projectIdByName(request, sample.project),
					`Project "${sample.project}" is not registered.`
				);
			});
			await when(
				'I open the dashboard for that project on an older day',
				async () => {
					await dashboard.goto(sample.earlierDate, {
						mode: 'rows',
						projectId
					});
					await dashboard.expectRunIdVisible(sample.earlierRunId);
				}
			);
			await and('I press the Today button', () => dashboard.clickToday());
			await then("the dashboard shows that project's latest day", async () => {
				await dashboard.expectDateNotPinned();
				expect(await dashboardResolvedDate(request, projectId)).toBe(
					sample.latestDate
				);
			});
			await and('the runs of that latest day are listed', () =>
				dashboard.expectRunIdsVisible(sample.latestRunIds)
			);
			await but("the older day's run is not listed", () =>
				dashboard.expectRunIdHidden(sample.earlierRunId)
			);
		}
	);

	test(
		"Refreshing the dashboard refetches the day's runs",
		{ tag: ['@dashboard'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();
			let refetched: Promise<void> = Promise.resolve();

			await given('a run was imported for a day', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', async () => {
				await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
				await dashboard.expectRunIdVisible(runId);
			});
			await and('I press the refresh button', () => {
				refetched = dashboard.waitForDayFetch(() => dashboard.clickRefresh());
			});
			await then("the dashboard fetches the day's runs again", () => refetched);
			await and('the run is still listed', () =>
				dashboard.expectRunIdVisible(runId)
			);
		}
	);

	test(
		'Auto reload refreshes the dashboard on a timer',
		{ tag: ['@dashboard'] },
		async ({ page }) => {
			test.slow();

			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();

			await given('a run was imported for a day', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', async () => {
				await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
				await dashboard.expectRunIdVisible(runId);
			});
			await and('I turn on Auto reload', () => dashboard.setAutoReload(true));
			await then("the dashboard reloads the day's runs on its own", () =>
				dashboard.waitForDayFetch(() => undefined, {
					timeout: 60_000,
					notBefore: 20_000
				})
			);
			await when('I turn off Auto reload', () =>
				dashboard.setAutoReload(false)
			);
			await then('Auto reload is off', () => dashboard.expectAutoReload(false));
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'TV mode shows the dashboard full screen until Escape',
		{ tag: ['@dashboard'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();

			await given('a run was imported for a day', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', async () => {
				await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
				await dashboard.expectRunIdVisible(runId);
			});
			await and('I enter TV mode', () => dashboard.enterTvMode());
			await then(
				'the dashboard fills the screen without the page controls',
				() => dashboard.expectTvModeOpen()
			);
			await and('the run is listed on the TV screen', () =>
				dashboard.expectTvRunVisible(runId)
			);
			await when('I press Escape', () => dashboard.leaveTvMode());
			await then('TV mode is closed and the dashboard controls are back', () =>
				dashboard.expectTvModeClosed()
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Selecting a project in the sidebar scopes the dashboard to it',
		{ tag: ['@dashboard'] },
		async ({ page, request }) => {
			const dashboard = new DashboardPage(page);
			const picker = new ProjectPicker(page);
			const pair = requireCapability(
				runPairOnDifferentProjects(requireManifest()),
				'Fixture manifest contains no two projects with runs on the same day.'
			);
			const [selected, other] = pair.runs;
			let selectedProjectId = 0;

			await given(
				'two runs of different projects were imported for the same day',
				async () => {
					selectedProjectId = requireCapability(
						await projectIdByName(request, selected.project),
						`Project "${selected.project}" is not registered.`
					);
				}
			);
			await when('I open the dashboard for that day', () =>
				dashboard.goto(pair.date, { mode: 'rows' })
			);
			await then('both runs are listed', () =>
				dashboard.expectRunIdsVisible([selected.runId, other.runId])
			);
			await when("I select the first run's project in the sidebar", () =>
				picker.select(selectedProjectId)
			);
			await then("only that project's run is listed", async () => {
				await dashboard.expectRunIdVisible(selected.runId);
				await dashboard.expectRunIdHidden(other.runId);
			});
			await and('the sidebar shows the project as selected', () =>
				picker.expectSelectedLabel(selected.project)
			);
			await when('I select All projects in the sidebar', () =>
				picker.selectAll()
			);
			await then('both runs are listed again', () =>
				dashboard.expectRunIdsVisible([selected.runId, other.runId])
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A dashboard link restores the date, mode and auto reload',
		{ tag: ['@dashboard', '@url-params'] },
		async ({ page, request }) => {
			const dashboard = new DashboardPage(page);
			const { bundle, expectedRun, runId } = anyRun();
			let link: Record<string, string> = {};

			await given(
				'a link that pins a day, a layout, a project and auto reload',
				async () => {
					const projectId = requireCapability(
						await projectIdByName(request, bundle.project),
						`Project "${bundle.project}" is not registered.`
					);

					link = {
						main: expectedRun.dashboardDate,
						mode: 'rows',
						reload: '1',
						project: String(projectId)
					};
				}
			);
			await when('I open that link', () => dashboard.gotoWithParams(link));
			await then('the runs of that day are listed', () =>
				dashboard.expectRunIdVisible(runId)
			);
			await and('the layout the link asked for is selected', () =>
				dashboard.expectModeActive('rows')
			);
			await and('auto reload is on', () => dashboard.expectAutoReload(true));
			await and(
				'the link still carries every parameter it was opened with',
				() => dashboard.expectParams(link)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Searching the dashboard records the term in the URL and survives a reload',
		{ tag: ['@dashboard', '@url-params'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();
			const term = 'no-run-matches-this-term';

			await given('a run was imported for a day', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open the dashboard for that day', async () => {
				await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
				await dashboard.expectRunIdVisible(runId);
			});
			await and('I search for a term that no run matches', () =>
				dashboard.search(term)
			);
			await then('the search term is recorded in the URL', () =>
				dashboard.expectParams({ search: term })
			);
			await and('the run is no longer listed', () =>
				dashboard.expectRunIdHidden(runId)
			);
			await when('I reload the page', () =>
				dashboard.waitForDayFetch(() => page.reload())
			);
			await then('the search box still holds the term', () =>
				dashboard.expectSearchInput(term)
			);
			await and('the run is still not listed', () =>
				dashboard.expectRunIdHidden(runId)
			);
			await when('I clear the search', () => dashboard.clearSearch());
			await then('the URL keeps an empty search term', () =>
				dashboard.expectParams({ search: '' })
			);
			await and('the run is listed again', () =>
				dashboard.expectRunIdVisible(runId)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Switching to two-day mode pins the previous day as the second date',
		{ tag: ['@dashboard', '@url-params'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();
			const date = expectedRun.dashboardDate;

			await given(
				'I open the dashboard for a day in single-day mode',
				async () => {
					await dashboard.goto(date, { mode: 'rows' });
					await dashboard.expectRunIdVisible(runId);
				}
			);
			await when('I switch the layout to two days per column', () =>
				dashboard.setMode('columns')
			);
			await then('the URL pins the day before as the second date', () =>
				dashboard.expectParams({ secondary: shiftDate(date, -1) })
			);
			await and('the day I opened is still pinned as the first date', () =>
				dashboard.expectParams({ main: date })
			);
			await when('I switch the layout back to a single day', () =>
				dashboard.setMode('rows')
			);
			await then('the URL no longer pins a second date', () =>
				dashboard.expectParams({ secondary: null })
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Dashboard controls preserve the other URL parameters',
		{ tag: ['@dashboard', '@url-params'] },
		async ({ page, request }) => {
			const dashboard = new DashboardPage(page);
			const { bundle, expectedRun, runId } = anyRun();
			let pinned: Record<string, string> = {};

			await given(
				'a link that pins a day, a search term and a project',
				async () => {
					const projectId = requireCapability(
						await projectIdByName(request, bundle.project),
						`Project "${bundle.project}" is not registered.`
					);

					pinned = {
						main: expectedRun.dashboardDate,
						search: expectedRun.name,
						project: String(projectId)
					};

					await dashboard.gotoWithParams({ ...pinned, mode: 'rows' });
					await dashboard.expectRunIdVisible(runId);
				}
			);
			await when('I turn on Auto reload', () => dashboard.setAutoReload(true));
			await then(
				'the day, the search term and the project are still pinned',
				() => dashboard.expectParams(pinned)
			);
			await when('I switch the layout to two days per column', () =>
				dashboard.setMode('columns')
			);
			await then(
				'the day, the search term and the project are still pinned',
				() => dashboard.expectParams(pinned)
			);
			await when('I enter TV mode and press Escape', async () => {
				await dashboard.enterTvMode();
				await dashboard.expectTvScreenVisible();
				await dashboard.leaveTvMode();
				await dashboard.expectTvModeClosed();
			});
			await then(
				'the day, the search term and the project are still pinned',
				() => dashboard.expectParams(pinned)
			);
		}
	);

	test(
		'An unparsable date in the link falls back to the latest day',
		{ tag: ['@dashboard', '@url-params'] },
		async ({ page, request }) => {
			const dashboard = new DashboardPage(page);
			const sample = requireCapability(
				projectSpanningDays(requireManifest()),
				'Fixture manifest contains no project with runs on more than one day.'
			);
			let projectId = 0;

			await given('a link whose pinned date cannot be parsed', async () => {
				projectId = requireCapability(
					await projectIdByName(request, sample.project),
					`Project "${sample.project}" is not registered.`
				);
			});
			await when('I open that link', () =>
				dashboard.gotoWithParams({
					main: 'not-a-date',
					mode: 'rows',
					project: String(projectId)
				})
			);
			await then(
				'the dashboard shows the latest day of that project',
				async () => {
					expect(await dashboardResolvedDate(request, projectId)).toBe(
						sample.latestDate
					);
					await dashboard.expectRunIdsVisible(sample.latestRunIds);
				}
			);
			await and('the URL still carries the unparsable date', () =>
				dashboard.expectParams({ main: 'not-a-date' })
			);
		}
	);

	test(
		'A legacy dates link is rewritten into the pinned days',
		{ tag: ['@dashboard', '@url-params'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();
			const later = expectedRun.dashboardDate;
			const earlier = shiftDate(later, -1);
			const dates = Buffer.from(
				JSON.stringify({ startDate: earlier, endDate: later })
			).toString('base64');

			await given(
				'a link that pins its two days in the old encoded dates parameter',
				() => expect(dates).not.toBe('')
			);
			await when('I open that link', async () => {
				await dashboard.gotoWithParams({ dates, mode: 'columns' });
				await dashboard.expectRunIdVisible(runId);
			});
			await then(
				'the URL pins the earlier day as the second date and the later as the first',
				() => dashboard.expectParams({ main: later, secondary: earlier })
			);
			await and('the URL no longer carries the encoded dates parameter', () =>
				dashboard.expectParamsAbsent(['dates'])
			);
			await and('the layout the link asked for is still selected', () =>
				dashboard.expectParams({ mode: 'columns' })
			);
		}
	);

	test(
		'A TV mode link opens the dashboard full screen without forcing auto reload',
		{ tag: ['@dashboard', '@url-params'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();
			const link = {
				main: expectedRun.dashboardDate,
				mode: 'rows',
				tv: '1',
				reload: '0'
			};

			await given('a link that pins a day and asks for TV mode', () =>
				expect(expectedRun.dashboardDate).toBeTruthy()
			);
			await when('I open that link', () => dashboard.gotoWithParams(link));
			await then("the TV screen is shown with that day's run", async () => {
				await dashboard.expectTvScreenVisible();
				await dashboard.expectTvRunVisible(runId);
			});
			await and('auto reload is left as the link set it', () =>
				dashboard.expectParams({ reload: '0', tv: '1' })
			);
		}
	);

	test(
		'A dashboard link pinning two days shows both of them',
		{ tag: ['@dashboard', '@url-params'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const spanning = requireCapability(
				projectSpanningDays(requireManifest()),
				'Fixture manifest contains no project with runs on two days.'
			);
			const link = {
				main: spanning.latestDate,
				secondary: spanning.earlierDate,
				mode: 'columns'
			};

			await given(
				'a link that pins two days a project has runs on in the two-day layout',
				() => expect(spanning.latestDate).not.toBe(spanning.earlierDate)
			);
			await when('I open that link', () => dashboard.gotoWithParams(link));
			await then('the runs of both days are listed', async () => {
				await dashboard.expectRunIdsVisible(spanning.latestRunIds);
				await dashboard.expectRunIdVisible(spanning.earlierRunId);
			});
			await and('the link still carries both days', () =>
				dashboard.expectParams(link)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A dashboard link with an empty search term lists every run of the day',
		{ tag: ['@dashboard', '@url-params'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId } = anyRun();
			const link = {
				main: expectedRun.dashboardDate,
				mode: 'rows',
				search: ''
			};

			await given('a link that pins a day and an empty search term', () =>
				expect(link.search).toBe('')
			);
			await when('I open that link', () => dashboard.gotoWithParams(link));
			await then('the runs of that day are listed', () =>
				dashboard.expectRunIdVisible(runId)
			);
			await and('the URL still carries the empty search term', () =>
				dashboard.expectParams({ search: '' })
			);
		}
	);
});
