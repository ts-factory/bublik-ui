/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';
import type { Locator, Page } from '@playwright/test';

import { DashboardPage } from './pages/dashboard-page';
import { LogPage } from './pages/log-page';
import { RunPage } from './pages/run-page';
import type { DiscriminatingResultBadge } from './pages/run-page';
import { RunsPage } from './pages/runs-page';
import { HistoryPage } from './pages/history-page';
import {
	firstResultNode,
	importedRunId,
	reportConfiguredImportedRun,
	representativeImportedRun
} from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';
import {
	artifactResultCase,
	mutableRun,
	representativeNokRun,
	requirementResultCase
} from './support/sample-cases';
import type { ResultTableCase } from './support/sample-cases';

function nokRun() {
	const representative = requireCapability(
		representativeNokRun(requireManifest()),
		'Fixture manifest contains no NOK samples.'
	);

	return { ...representative, runId: importedRunId(representative.bundle) };
}

function scratchRun() {
	const scratch = requireCapability(
		mutableRun(requireManifest()),
		'Fixture manifest contains no healthy run that is safe to mutate.'
	);

	return { ...scratch, runId: importedRunId(scratch.bundle) };
}

function artifactRun(): ResultTableCase {
	return requireCapability(
		artifactResultCase(requireManifest()),
		'Fixture manifest contains no test path whose results report differing artifacts.'
	);
}

function requirementRun(): ResultTableCase {
	return requireCapability(
		requirementResultCase(requireManifest()),
		'Fixture manifest contains no test path whose results carry both requirements and verdicts.'
	);
}

async function openResultTable(page: Page, testCase: ResultTableCase) {
	const runPage = new RunPage(page);

	await runPage.goto(testCase.runId);
	await runPage.expectLoaded(testCase.bundle.expectedRuns[0].name);

	const table = await runPage.openResultTableAt(
		testCase.path.slice(0, -1),
		testCase.testName
	);

	return { runPage, table };
}

function nokVerdictCase() {
	const manifest = requireManifest();

	for (const bundle of manifest.bundles) {
		if (!bundle.runId) continue;

		for (const expectedRun of bundle.expectedRuns) {
			const sample = (expectedRun.sampleTests.unexpectedFailed ?? []).find(
				(entry) => entry.verdicts.length > 0
			);

			if (sample) {
				return {
					bundle,
					expectedRun,
					runId: importedRunId(bundle),
					testName: sample.name || sample.pathStr
				};
			}
		}
	}

	return null;
}

function historyParams(url: string): URLSearchParams {
	return new URL(url).searchParams;
}

test.describe('Run Details Page', () => {
	test.afterEach(async ({ page }, testInfo) => {
		const cleanups: string[] = [];

		if (testInfo.tags.includes('@compromised')) cleanups.push('compromised/');
		if (testInfo.tags.includes('@comments')) cleanups.push('comment/');
		if (!cleanups.length) return;

		const { runId } = scratchRun();

		for (const resource of cleanups) {
			await page.request
				.delete(`/api/v2/runs/${runId}/${resource}`)
				.catch(() => undefined);
		}
	});

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Run details show the metadata recorded in the manifest',
		{ tag: ['@smoke'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = representativeImportedRun(
				requireManifest()
			);

			await given('the fixture manifest describes an imported run', () =>
				expect(runId).toBeGreaterThan(0)
			);
			await when("I open that run's page", async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
			});
			await then('the info card shows the run id', () =>
				runPage.expectDetail('Run ID', String(runId))
			);
			await and('the info card shows the conclusion', () =>
				runPage.expectDetail('Conclusion')
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test('Exposing the run info reveals the full detail set', async ({
		page
	}) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());

		await given("I open an imported run's page", async () => {
			await runPage.goto(runId);
			await runPage.expectLoaded(expectedRun.name);
		});
		await when('I expose the full run info', () => runPage.toggleFullMode());
		await then(
			'the info card also shows the run status and duration',
			async () => {
				await runPage.expectDetail('Status');
				await runPage.expectDetail('Duration');
			}
		);
	});

	test('Expanding a package reveals the tests it contains', async ({
		page
	}) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());
		let rowsBefore = 0;

		await given("I open an imported run's page", async () => {
			await runPage.goto(runId);
			await runPage.expectLoaded(expectedRun.name);
			rowsBefore = await runPage.rows().count();
		});
		await when('I expand the first collapsed package of the tree', async () => {
			const collapsed = runPage.packageRows({ expanded: false }).first();
			await expect(collapsed).toBeVisible({ timeout: 30_000 });
			await runPage.toggleTreeNode(collapsed);
		});
		await then('more rows are shown than before', () =>
			runPage.expectRowCountAbove(rowsBefore)
		);
	});

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Open NOK expands the result tables of the unexpected results',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = nokRun();

			await given('I open a run that has unexpected results', async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
			});
			await when('I press Open NOK', () => runPage.openNok());
			await then('at least one result table is expanded', () =>
				runPage.expectResultTableVisible()
			);
			await when('I press Reset', () => runPage.resetTable());
			await then('no result table is expanded', () =>
				runPage.expectNoResultTable()
			);
		}
	);

	test(
		'Preview NOK expands the tree without opening result tables',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId, sampleNames } = nokRun();

			await given('I open a run that has unexpected results', async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
			});
			await when('I press Preview NOK', () => runPage.previewNok());
			await then('the tests with unexpected results are listed', async () => {
				for (const sampleName of sampleNames) {
					await expect(page.getByText(sampleName).first()).toBeVisible({
						timeout: 15_000
					});
				}
			});
			await and('no result table is expanded', () =>
				runPage.expectNoResultTable()
			);
		}
	);

	test("Clicking a count badge opens that test's result table", async ({
		page
	}) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());
		let testName = '';

		let testRow = page.locator('never');

		await given(
			"I open an imported run's page and expand the tree down to a test",
			async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
				testRow = await runPage.expandUntilTestRow();
				testName = (await testRow.getAttribute('data-test-name')) ?? '';
			}
		);
		await when('I click the total count badge of that test row', () =>
			runPage.firstCountBadge(testRow).click()
		);
		await then("that test's result table is expanded", () =>
			expect(runPage.resultTable(testName)).toBeVisible({ timeout: 30_000 })
		);
	});

	test('The run header opens the log of the whole run', async ({ page }) => {
		const runPage = new RunPage(page);
		const logPage = new LogPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());

		await given("I open an imported run's page", async () => {
			await runPage.goto(runId);
			await runPage.expectLoaded(expectedRun.name);
		});
		await when("I follow the header's Log link", () =>
			page.getByRole('banner').getByRole('link', { name: /^Log$/ }).click()
		);
		await then('the log page for that run is open', async () => {
			await expect(page).toHaveURL(new RegExp(`/log/${runId}`));
			await logPage.expectLoaded();
		});
	});

	test('A result row links to the log of that result', async ({ page }) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());

		await given(
			"I open an imported run's page with a result table expanded",
			async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);

				const testRow = await runPage.expandUntilTestRow();
				await runPage.firstCountBadge(testRow).click();
				await runPage.expectResultTableVisible();
			}
		);
		await when("I follow the result's Log link", () =>
			runPage
				.resultTables()
				.first()
				.getByRole('link', { name: 'Log', exact: true })
				.first()
				.click()
		);
		await then('the log page opens focused on that result', () =>
			expect(page).toHaveURL(new RegExp(`/log/${runId}.*focusId=\\d+`), {
				timeout: 15_000
			})
		);
	});

	test('The compare form rejects a value that is not a run', async ({
		page
	}) => {
		const runPage = new RunPage(page);
		const { expectedRun, runId } = representativeImportedRun(requireManifest());

		await given("I open an imported run's page", async () => {
			await runPage.goto(runId);
			await runPage.expectLoaded(expectedRun.name);
		});
		await when(
			'I open the compare form and submit an invalid run reference',
			async () => {
				const form = await runPage.openCompareForm();
				await form.getByLabel('Right Run').fill('not-a-run');
				await form.getByRole('button', { name: 'Compare' }).click();
			}
		);
		await then(
			'the form reports that the value is not a valid URL or run id',
			() =>
				expect(page.getByText(/Must be a valid URL/).first()).toBeVisible({
					timeout: 15_000
				})
		);
	});

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking an obtained result badge filters the result table to that result',
		{ tag: ['@run'] },
		async ({ page }) => {
			const testCase = artifactRun();
			let runPage!: RunPage;
			let table!: Locator;
			let badge!: DiscriminatingResultBadge;

			await given(
				'I open a run with the result table of a test that reports artifacts expanded',
				async () => {
					({ runPage, table } = await openResultTable(page, testCase));
					badge = await runPage.pickDiscriminatingResultBadge(
						table,
						'obtained-result',
						'result'
					);
				}
			);
			await when('I click the obtained result badge of the first row', () =>
				runPage.obtainedResultBadge(table, badge.rowIndex).click()
			);
			await then('only the results of that type are listed', () =>
				runPage.expectResultRowsNarrowedByResult(
					table,
					badge.text,
					badge.totalRows
				)
			);
			await and('the Obtained Result filter of the toolbar reports it', () =>
				runPage.expectFacetedFilterReports(table, 'Obtained Result', badge.text)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking an artifact badge narrows the result table to the results reporting it',
		{ tag: ['@run'] },
		async ({ page }) => {
			const testCase = artifactRun();
			let runPage!: RunPage;
			let table!: Locator;
			let badge!: DiscriminatingResultBadge;

			await given(
				'I open a run with the result table of a test that reports artifacts expanded',
				async () => {
					({ runPage, table } = await openResultTable(page, testCase));
					badge = await runPage.pickDiscriminatingResultBadge(
						table,
						'artifacts'
					);
				}
			);
			await when(
				'I click an artifact badge that only some of the results carry',
				() => runPage.clickResultBadge(table, 'artifacts', badge.text)
			);
			await then('only the results carrying that artifact are listed', () =>
				runPage.expectResultRowsNarrowedTo(
					table,
					'artifacts',
					badge.text,
					badge.matchingRows
				)
			);
			await and('the Artifacts filter of the toolbar reports it', () =>
				runPage.expectFacetedFilterReports(table, 'Artifacts', badge.text)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a parameter badge narrows the result table to the matching iterations',
		{ tag: ['@run'] },
		async ({ page }) => {
			const testCase = artifactRun();
			let runPage!: RunPage;
			let table!: Locator;
			let badge!: DiscriminatingResultBadge;

			await given(
				'I open a run with the result table of a test that reports artifacts expanded',
				async () => {
					({ runPage, table } = await openResultTable(page, testCase));
					badge = await runPage.pickDiscriminatingResultBadge(
						table,
						'parameters'
					);
				}
			);
			await when(
				'I click a parameter badge that only some of the iterations carry',
				() => runPage.clickResultBadge(table, 'parameters', badge.text)
			);
			await then('only the iterations carrying that parameter are listed', () =>
				runPage.expectResultRowsNarrowedTo(
					table,
					'parameters',
					badge.text,
					badge.matchingRows
				)
			);
			await and('the Parameters filter of the toolbar reports it', () =>
				runPage.expectFacetedFilterReports(table, 'Parameters', badge.text)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a badge reveals the result table filter toolbar',
		{ tag: ['@run'] },
		async ({ page }) => {
			const testCase = artifactRun();
			let runPage!: RunPage;
			let table!: Locator;
			let badge!: DiscriminatingResultBadge;

			await given(
				'I open a run with the result table of a test that reports artifacts expanded',
				async () => {
					({ runPage, table } = await openResultTable(page, testCase));
					badge = await runPage.pickDiscriminatingResultBadge(
						table,
						'obtained-result',
						'result'
					);
				}
			);
			await then('the filter toolbar is hidden', () =>
				runPage.expectToolbarHidden(table)
			);
			await when('I click the obtained result badge of the first row', () =>
				runPage.obtainedResultBadge(table, badge.rowIndex).click()
			);
			await then('the filter toolbar is shown', () =>
				runPage.expectToolbarVisible(table)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The Filters toggle shows and hides the result table toolbar',
		{ tag: ['@run'] },
		async ({ page }) => {
			const testCase = artifactRun();
			let runPage!: RunPage;
			let table!: Locator;

			await given(
				'I open a run with the result table of a test that reports artifacts expanded',
				async () => {
					({ runPage, table } = await openResultTable(page, testCase));
				}
			);
			await when('I press Filters in the Requirements header', () =>
				runPage.filtersToggle.first().click()
			);
			await then('the filter toolbar is shown', () =>
				runPage.expectToolbarVisible(table)
			);
			await when('I press Filters again', () =>
				runPage.filtersToggle.first().click()
			);
			await then('the filter toolbar is hidden', () =>
				runPage.expectToolbarHidden(table)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Reset clears every result table filter',
		{ tag: ['@run'] },
		async ({ page }) => {
			const testCase = artifactRun();
			let runPage!: RunPage;
			let table!: Locator;
			let totalRows = 0;

			let badge!: DiscriminatingResultBadge;

			await given(
				'I open a run with the result table of a test that reports artifacts expanded',
				async () => {
					({ runPage, table } = await openResultTable(page, testCase));
					badge = await runPage.pickDiscriminatingResultBadge(
						table,
						'artifacts'
					);
					totalRows = badge.totalRows;
				}
			);
			await when('I press Filters in the Requirements header', () =>
				runPage.filtersToggle.first().click()
			);
			await and(
				'I click an artifact badge that only some of the results carry',
				() => runPage.clickResultBadge(table, 'artifacts', badge.text)
			);
			await then('only the results carrying that artifact are listed', () =>
				runPage.expectResultRowsNarrowedTo(
					table,
					'artifacts',
					badge.text,
					badge.matchingRows
				)
			);
			await when('I press Reset in the filter toolbar', () =>
				runPage.resetResultFilters(table)
			);
			await then('every result of that test is listed again', () =>
				expect
					.poll(() => runPage.resultRowCount(table), { timeout: 15_000 })
					.toBe(totalRows)
			);
			await and('no toolbar filter reports a selection', () =>
				runPage.expectNoFacetedFilterSelection(table)
			);
		}
	);

	test(
		'Result table filters are recorded in the URL and survive a reload',
		{ tag: ['@run', '@url-params'] },
		async ({ page }) => {
			const testCase = artifactRun();
			let runPage!: RunPage;
			let table!: Locator;
			let badge!: DiscriminatingResultBadge;

			await given(
				'I open a run with the result table narrowed by an artifact badge',
				async () => {
					({ runPage, table } = await openResultTable(page, testCase));
					badge = await runPage.pickDiscriminatingResultBadge(
						table,
						'artifacts'
					);

					await runPage.clickResultBadge(table, 'artifacts', badge.text);
					await runPage.expectResultRowsNarrowedTo(
						table,
						'artifacts',
						badge.text,
						badge.matchingRows
					);
				}
			);
			await then('the URL carries the result table column filters', () =>
				runPage.expectColumnFiltersInUrl()
			);
			await when('I reload the page', async () => {
				await page.reload();
				await runPage.expectLoaded(testCase.bundle.expectedRuns[0].name);
			});
			await then(
				'the result table is still narrowed the same way',
				async () => {
					const restored = runPage.resultTable(testCase.testName).first();
					await expect(restored).toBeVisible({ timeout: 60_000 });
					await runPage.expectResultRowsNarrowedTo(
						restored,
						'artifacts',
						badge.text,
						badge.matchingRows
					);
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a verdict badge narrows the result table to the results reporting it',
		{ tag: ['@run', '@needs-nok'] },
		async ({ page }) => {
			test.slow();

			const testCase = requirementRun();
			let runPage!: RunPage;
			let table!: Locator;
			let badge!: DiscriminatingResultBadge;

			await given(
				'I open a run whose results carry both requirements and verdicts',
				async () => {
					({ runPage, table } = await openResultTable(page, testCase));
					badge = await runPage.pickDiscriminatingResultBadge(
						table,
						'obtained-result',
						'verdicts'
					);
				}
			);
			await when(
				'I click a verdict badge that only some of the results carry',
				() =>
					runPage
						.verdictBadges(table, badge.rowIndex)
						.filter({ hasText: badge.text })
						.first()
						.click()
			);
			await then('only the results carrying that verdict are listed', () =>
				runPage.expectResultRowsNarrowedTo(
					table,
					'obtained-result',
					badge.text,
					badge.matchingRows,
					'verdicts'
				)
			);
			await and('the Verdicts filter of the toolbar reports it', () =>
				runPage.expectFacetedFilterReports(table, 'Verdicts', badge.text)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a requirement badge narrows the result table to that requirement',
		{ tag: ['@run', '@needs-nok'] },
		async ({ page }) => {
			test.slow();

			const testCase = requirementRun();
			let runPage!: RunPage;
			let table!: Locator;
			let badge!: DiscriminatingResultBadge;

			await given(
				'I open a run whose results carry both requirements and verdicts',
				async () => {
					({ runPage, table } = await openResultTable(page, testCase));
					badge = await runPage.pickDiscriminatingResultBadge(
						table,
						'requirements'
					);
				}
			);
			await when(
				'I click a requirement badge that only some of the results carry',
				() => runPage.clickResultBadge(table, 'requirements', badge.text)
			);
			await then('only the results carrying that requirement are listed', () =>
				runPage.expectResultRowsNarrowedTo(
					table,
					'requirements',
					badge.text,
					badge.matchingRows
				)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A run comment can be added and then removed',
		{ tag: ['@run', '@comments'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = scratchRun();
			const comment = 'e2e run comment';

			await given("I open an imported run's page with no comment", async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
				await runPage.expectNoComment();
			});
			await when('I add a comment to the run', async () => {
				await runPage.openCommentEditor();
				await runPage.submitComment(comment);
			});
			await then('the info card shows that comment', () =>
				runPage.expectComment(comment)
			);
			await when('I remove the run comment', async () => {
				await runPage.openCommentEditor();
				await runPage.submitComment('');
			});
			await then('the info card shows no comment', () =>
				runPage.expectNoComment()
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A note can be added to a test node and then removed',
		{ tag: ['@run', '@comments'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = scratchRun();
			const note = 'e2e test node note';
			let testRow = page.locator('never');

			await given(
				"I open an imported run's page with the Notes column shown",
				async () => {
					await runPage.goto(runId);
					await runPage.expectLoaded(expectedRun.name);
					await runPage.showColumn('Notes');
					testRow = await runPage.expandUntilTestRow();
				}
			);
			await when('I add a note to a test node', () =>
				runPage.addNote(testRow, note)
			);
			await then('that test node shows the note', () =>
				runPage.expectNote(testRow, note)
			);
			await when('I delete the note', () => runPage.deleteNote(testRow));
			await then('that test node has no note', () =>
				runPage.expectNoNote(testRow)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Marking a run as compromised marks it on the run, runs and dashboard pages',
		{ tag: ['@run', '@runs', '@dashboard', '@compromised'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const runsPage = new RunsPage(page);
			const dashboard = new DashboardPage(page);
			const { bundle, expectedRun, runId } = scratchRun();

			await given('I open a run that is not compromised', async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
				await runPage.ensureNotCompromised();
			});
			await when('I mark the run as compromised', () =>
				runPage.markCompromised({ comment: 'e2e compromise', bugId: '42' })
			);
			await then('the run page reports the run as compromised', () =>
				runPage.expectCompromised()
			);
			await and("the run's conclusion is compromised", () =>
				runPage.expectDetail('Conclusion', 'compromised')
			);

			await when('I open the runs page filtered to that run', async () => {
				await runsPage.gotoWithTagExpr(`fixture_id=${bundle.e2eRunId}`);
				await runsPage.expectRowVisible(runId);
			});
			await then('the runs row reports the run as compromised', () =>
				runsPage.expectRowConclusion(runId, 'compromised')
			);

			await when("I open the dashboard for that run's date", async () => {
				await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
				await dashboard.expectRunIdVisible(runId);
			});
			await then('the dashboard row reports the run as compromised', () =>
				dashboard.expectRowConclusion(runId, 'compromised')
			);

			await when('I remove the compromised status from the run', async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
				await runPage.removeCompromised();
			});
			await then('the run page no longer reports the run as compromised', () =>
				runPage.expectNotCompromised()
			);
		}
	);

	test(
		'The compromise form requires a comment',
		{ tag: ['@run', '@compromised'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = scratchRun();

			await given('I open a run that is not compromised', async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
				await runPage.ensureNotCompromised();
			});
			await when('I submit the compromise form without a comment', async () => {
				const form = await runPage.openCompromiseForm();
				await form.getByLabel('Bug ID').fill('42');
				await form.getByRole('button', { name: 'Submit' }).click();
			});
			await then('the form reports that a comment is required', () =>
				expect(page.getByText('Comment is required').first()).toBeVisible({
					timeout: 15_000
				})
			);
		}
	);

	test(
		'The History link opens the history for the test path, parameters and important tags',
		{ tag: ['@run', '@history'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = representativeImportedRun(
				requireManifest()
			);
			let testName = '';

			await given(
				"I open an imported run's page with a result table expanded",
				async () => {
					await runPage.goto(runId);
					await runPage.expectLoaded(expectedRun.name);

					const testRow = await runPage.expandUntilTestRow();
					testName = (await testRow.getAttribute('data-test-name')) ?? '';
					await runPage.firstCountBadge(testRow).click();
					await runPage.expectResultTableVisible();
				}
			);
			await when("I follow the result's History link", async () => {
				await runPage.historyLink(testName).first().click();
				await expect(page).toHaveURL(/\/history/, { timeout: 15_000 });
			});
			await then('the history page opens filtered by that test path', () =>
				expect(historyParams(page.url()).get('testName')).toContain(testName)
			);
			await and(
				"the history query carries the result parameters and the run's important tags",
				() => {
					const params = historyParams(page.url());
					expect(params.get('parameters')).toBeTruthy();
					expect(params.get('runData')).toBeTruthy();
				}
			);
		}
	);

	test.describe('The result history menu filters the history by the chosen variant', () => {
		async function expectVariantParams(
			page: Page,
			variant: string,
			expectation: { present: string[]; absent: string[] }
		): Promise<void> {
			const runPage = new RunPage(page);
			const { expectedRun, runId, testName } = requireCapability(
				nokVerdictCase(),
				'Fixture manifest contains no unexpected failure carrying a verdict.'
			);

			await given(
				'I open a run with unexpected results and a result table expanded',
				async () => {
					await runPage.goto(runId);
					await runPage.expectLoaded(expectedRun.name);
					await runPage.previewNok();

					const testRow = runPage.testNodeRow(testName).first();
					await expect(testRow).toBeVisible({ timeout: 30_000 });
					await runPage.countBadge(testRow, 'FAILED_UNEXPECTED').click();
					await runPage.expectResultTableVisible();
				}
			);
			await when(
				'I choose the given variant from the result history menu',
				async () => {
					await runPage.openResultHistoryMenu(testName);
					await runPage.chooseHistoryLink(variant, 'direct');
					await expect(page).toHaveURL(/\/history/, { timeout: 15_000 });
				}
			);
			await then(
				'the history query carries the parameters of that variant',
				() => {
					const params = historyParams(page.url());

					expect(params.get('testName')).toContain(testName);
					for (const name of expectation.present) {
						expect(params.get(name)).toBeTruthy();
					}
					for (const name of expectation.absent) {
						expect(params.get(name)).toBeFalsy();
					}
				}
			);
		}

		// eslint-disable-next-line playwright/expect-expect
		test('Path only', { tag: ['@run', '@history', '@needs-nok'] }, ({ page }) =>
			expectVariantParams(page, 'Test Path', {
				present: [],
				absent: ['parameters', 'verdict', 'runData']
			})
		);

		// eslint-disable-next-line playwright/expect-expect
		test(
			'Path and verdicts',
			{ tag: ['@run', '@history', '@needs-nok'] },
			({ page }) =>
				expectVariantParams(page, 'Test Path + Verdicts', {
					present: ['verdict'],
					absent: ['parameters']
				})
		);

		// eslint-disable-next-line playwright/expect-expect
		test(
			'Path and parameters',
			{ tag: ['@run', '@history', '@needs-nok'] },
			({ page }) =>
				expectVariantParams(page, 'Test Path + Parameters', {
					present: ['parameters'],
					absent: ['verdict']
				})
		);

		// eslint-disable-next-line playwright/expect-expect
		test(
			'Path, parameters and all tags',
			{ tag: ['@run', '@history', '@needs-nok'] },
			({ page }) =>
				expectVariantParams(page, 'Test Path + Parameters + All Tags', {
					present: ['parameters', 'runData'],
					absent: ['verdict']
				})
		);
	});

	test(
		'A prefilled history link opens the global search form with the query prefilled',
		{ tag: ['@run', '@history'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const historyPage = new HistoryPage(page);
			const { expectedRun, runId } = representativeImportedRun(
				requireManifest()
			);
			let testName = '';

			await given(
				"I open an imported run's page with a result table expanded",
				async () => {
					await runPage.goto(runId);
					await runPage.expectLoaded(expectedRun.name);

					const testRow = await runPage.expandUntilTestRow();
					testName = (await testRow.getAttribute('data-test-name')) ?? '';
					await runPage.firstCountBadge(testRow).click();
					await runPage.expectResultTableVisible();
				}
			);
			await when(
				'I choose a prefilled variant from the result history menu',
				async () => {
					await runPage.openResultHistoryMenu(testName);
					await runPage.chooseHistoryLink('Test Path + Verdicts', 'prefilled');
					await expect(page).toHaveURL(/fromRun=true/, { timeout: 15_000 });
				}
			);
			await then(
				'the global search form opens with that test path prefilled',
				async () => {
					await historyPage.globalSearchForm.expectVisible();
					await expect(historyPage.globalSearchForm.testPathInput).toHaveValue(
						new RegExp(testName),
						{ timeout: 15_000 }
					);
				}
			);
		}
	);

	test(
		'The test node history link opens the history scoped to that run',
		{ tag: ['@run', '@history'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = representativeImportedRun(
				requireManifest()
			);
			let testName = '';
			let testRow = page.locator('never');

			await given(
				"I open an imported run's page and expand the tree down to a test node",
				async () => {
					await runPage.goto(runId);
					await runPage.expectLoaded(expectedRun.name);
					testRow = await runPage.expandUntilTestRow();
					testName = (await testRow.getAttribute('data-test-name')) ?? '';
				}
			);
			await when('I open the history view of that test node', async () => {
				await runPage.openTestNodeHistory(testRow);
				await expect(page).toHaveURL(/\/history/, { timeout: 15_000 });
			});
			await then(
				'the history query is scoped to that run and test path',
				() => {
					const params = historyParams(page.url());

					expect(params.get('runIds')).toBe(String(runId));
					expect(params.get('testName')).toContain(testName);
				}
			);
		}
	);

	test(
		'The reports menu lists the configured report',
		{ tag: ['@needs-report'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const manifest = requireManifest();
			const { expectedRun, runId } = reportConfiguredImportedRun(manifest);
			const configName = requireCapability(
				manifest.configs.find((config) => config.type === 'report')?.name,
				'Fixture manifest contains no report config.'
			);

			await given(
				'I open a run whose project has a report config',
				async () => {
					await runPage.goto(runId);
					await runPage.expectLoaded(expectedRun.name);
				}
			);
			await when('I open the reports menu', () => runPage.openReports());
			await then('the configured report is offered', () =>
				expect(page.getByRole('menuitem', { name: configName })).toBeVisible({
					timeout: 15_000
				})
			);
		}
	);

	test(
		'Expanding the run tree records the compressed state in the URL',
		{ tag: ['@run', '@url-params'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = representativeImportedRun(
				requireManifest()
			);
			let expandedBefore: string[] = [];

			await given("I open an imported run's page", async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
			});
			await when('I expand a collapsed package of the tree', async () => {
				await runPage.toggleTreeNode(
					runPage.packageRows({ expanded: false }).first()
				);
				await runPage.expectExpandedPackage();
				expandedBefore = await runPage.expandedRowNames();
				expect(expandedBefore.length).toBeGreaterThan(0);
			});
			await then('the URL carries the compressed expanded state', () =>
				runPage.expectCompressedParams(['expanded'])
			);
			await when('I reload the page', async () => {
				await page.reload();
				await runPage.expectLoaded(expectedRun.name);
			});
			await then('the same rows are expanded', () =>
				runPage.expectExpandedRowNames(expandedBefore)
			);
		}
	);

	test(
		'A shared run link restores the tree the sender had expanded',
		{ tag: ['@run', '@url-params'] },
		async ({ page, browser }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = representativeImportedRun(
				requireManifest()
			);
			let link = '';
			let expandedBefore: string[] = [];

			await given('I have expanded a package of the run tree', async () => {
				await runPage.goto(runId);
				await runPage.expectLoaded(expectedRun.name);
				await runPage.toggleTreeNode(
					runPage.packageRows({ expanded: false }).first()
				);
				await runPage.expectExpandedPackage();
				await runPage.expectCompressedParams(['expanded']);

				link = runPage.captureLink();
				expandedBefore = await runPage.expandedRowNames();
			});
			await when(
				'I open the link that produced in a clean session',
				async () => {
					const context = await browser.newContext();
					const fresh = await context.newPage();
					const freshRun = new RunPage(fresh);

					await fresh.goto(link);
					await freshRun.expectLoaded(expectedRun.name);
					await freshRun.expectExpandedRowNames(expandedBefore);
					await context.close();
				}
			);
			await then('the same rows are expanded', () =>
				expect(expandedBefore.length).toBeGreaterThan(0)
			);
		}
	);

	test(
		'A plainly encoded run table state in the link is rewritten as compressed',
		{ tag: ['@run', '@url-params'] },
		async ({ page }) => {
			const runPage = new RunPage(page);
			const { expectedRun, runId } = representativeImportedRun(
				requireManifest()
			);
			const plainGlobalFilter = JSON.stringify([]);

			await given(
				'a link whose column order is plain JSON and whose global filter is not',
				() => expect(plainGlobalFilter).toBe('[]')
			);
			await when('I open that link', async () => {
				await runPage.gotoWithParams(runId, {
					globalFilter: plainGlobalFilter
				});
				await runPage.expectLoaded(expectedRun.name);
			});
			await then('the run table is rendered', () =>
				runPage.expectExpandedPackage()
			);
			await and('the global filter is rewritten into the compressed form', () =>
				expect
					.poll(() => runPage.paramValue('globalFilter'), {
						timeout: 15_000,
						message: 'globalFilter after the legacy migration'
					})
					.not.toBe(plainGlobalFilter)
			);
		}
	);

	test(
		"A run link targeting an iteration opens that result's table",
		{ tag: ['@run', '@url-params'] },
		async ({ page, request }) => {
			const runPage = new RunPage(page);
			const runCase = representativeImportedRun(requireManifest());
			const result = requireCapability(
				await firstResultNode(request, runCase),
				'Fixture tree contains no test result node.'
			);

			await given('a link that targets one iteration of an imported run', () =>
				expect(result.node.id).toBeTruthy()
			);
			await when('I open that link', async () => {
				await runPage.gotoWithParams(runCase.runId, {
					targetIterationId: String(result.node.id)
				});
				await runPage.expectLoaded(runCase.expectedRun.name);
			});
			await then("that iteration's result table is shown", () =>
				runPage.expectResultTableVisible()
			);
			await and('the link still carries the targeted iteration', () =>
				runPage.expectParams({ targetIterationId: String(result.node.id) })
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Opening a run from a NOK counter does not record the unexpected filter in the URL',
		{ tag: ['@run', '@url-params', '@needs-nok'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const runPage = new RunPage(page);
			const { expectedRun, runId } = nokRun();

			await given(
				'the dashboard lists a run with unexpected results',
				async () => {
					await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
					await dashboard.expectRunIdVisible(runId);
				}
			);
			await when("I click the run's NOK counter", () =>
				dashboard.openUnexpected(runId)
			);
			await then('the run page for that run is open', () =>
				runPage.expectLoaded(expectedRun.name)
			);
			await and('no unexpected filter is recorded in the URL', () =>
				runPage.expectParamsAbsent([
					'openUnexpected',
					'openUnexpectedResults',
					'openUnexpectedIntentId'
				])
			);
		}
	);
});
