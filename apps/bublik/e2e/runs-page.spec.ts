/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';
import type { Page } from '@playwright/test';

import { RunsPage } from './pages/runs-page';
import { RunPage } from './pages/run-page';
import { importedRunId } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';
import type { Bundle } from './support/manifest';
import {
	durationCoveringFixtures,
	expectedNokCount,
	representativeNokRun,
	representativeRun,
	runPairOnSameDate,
	runsBadgeDate
} from './support/sample-cases';
import type { DiscriminatingBadge, RunsBadgeColumn } from './pages/runs-page';

function fixtureTagExpr(bundle: Bundle): string {
	return `fixture_id=${bundle.e2eRunId}`;
}

function badgeDate(): string {
	return requireCapability(
		runsBadgeDate(requireManifest()),
		'Fixture manifest contains no date whose imported runs carry differing tags.'
	).date;
}

async function withBadgeFiltersApplied(page: Page): Promise<void> {
	await page.addInitScript(() => {
		window.localStorage.setItem(
			'user-preferences',
			JSON.stringify({ runs: { autoApplyBadgeFilters: true } })
		);
	});
}

async function openWithDiscriminatingBadge(
	page: Page,
	runsPage: RunsPage
): Promise<DiscriminatingBadge> {
	await withBadgeFiltersApplied(page);
	await runsPage.gotoForDate(badgeDate());
	await runsPage.expectTableLoaded();

	const columns: RunsBadgeColumn[] = ['important_tags', 'Metadata', 'Tags'];
	let lastError: unknown;

	for (const column of columns) {
		try {
			return await runsPage.pickDiscriminatingBadge(column);
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError;
}

test.describe('Runs Page', () => {
	// eslint-disable-next-line playwright/expect-expect
	test(
		'Runs table lists a run matching a tag expression',
		{ tag: ['@smoke'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			const { bundle } = representativeRun(requireManifest());

			await given('the fixture manifest describes an imported run', () =>
				expect(importedRunId(bundle)).toBeGreaterThan(0)
			);
			await when(
				"I open the runs page filtered by that run's fixture tag",
				() => runsPage.gotoWithTagExpr(fixtureTagExpr(bundle))
			);
			await then('the runs table lists that run', async () => {
				await runsPage.expectTableLoaded();
				await runsPage.expectRowVisible(importedRunId(bundle));
			});
		}
	);

	test('The Run link opens the run details page', async ({ page }) => {
		const runsPage = new RunsPage(page);
		const { bundle } = representativeRun(requireManifest());
		const runId = importedRunId(bundle);

		await given('the runs table lists a run', async () => {
			await runsPage.gotoWithTagExpr(fixtureTagExpr(bundle));
			await runsPage.expectRowVisible(runId);
		});
		await when("I follow the row's Run link", () => runsPage.openRun(runId));
		await then('the run details page is open', () =>
			expect(page.getByTestId('run-table')).toBeVisible({ timeout: 30_000 })
		);
	});

	// eslint-disable-next-line playwright/expect-expect
	test('The Log link opens the log page', async ({ page }) => {
		const runsPage = new RunsPage(page);
		const { bundle } = representativeRun(requireManifest());

		await given('the runs table lists a run', async () => {
			await runsPage.gotoWithTagExpr(fixtureTagExpr(bundle));
			await runsPage.expectTableLoaded();
		});
		await when("I follow the row's Log link", () =>
			runsPage.openLog(importedRunId(bundle))
		);
		await then('the log page for that run is open', () =>
			expect(page).toHaveURL(new RegExp(`/log/${importedRunId(bundle)}`))
		);
	});

	// eslint-disable-next-line playwright/expect-expect
	test('Sorting by statistic summary keeps the run listed', async ({
		page
	}) => {
		const runsPage = new RunsPage(page);
		const { bundle } = representativeRun(requireManifest());

		await given('the runs table lists a run', async () => {
			await runsPage.gotoWithTagExpr(fixtureTagExpr(bundle));
			await runsPage.expectTableLoaded();
		});
		await when('I sort the table by statistic summary', () =>
			runsPage.sortBySummary()
		);
		await then('the table is still healthy and the run is listed', async () => {
			await runsPage.expectTableLoaded();
			await runsPage.expectRowVisible(importedRunId(bundle));
		});
	});

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The NOK summary badge reports the unexpected result count',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			const representative = requireCapability(
				representativeNokRun(requireManifest()),
				'Fixture manifest contains no NOK samples.'
			);
			const runId = importedRunId(representative.bundle);
			const nokCount = expectedNokCount(representative.expectedRun);

			await given(
				'the fixture manifest describes a run with unexpected results',
				() => expect(nokCount).toBeGreaterThan(0)
			);
			await when(
				"I open the runs page filtered by that run's fixture tag",
				() => runsPage.gotoWithTagExpr(fixtureTagExpr(representative.bundle))
			);
			await then(
				"the row's NOK badge shows the unexpected result count from the manifest",
				() => runsPage.expectNokCount(runId, nokCount)
			);
		}
	);

	test(
		'Clicking the NOK badge opens the run with unexpected rows previewed',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			const runPage = new RunPage(page);
			const representative = requireCapability(
				representativeNokRun(requireManifest()),
				'Fixture manifest contains no NOK samples.'
			);
			const runId = importedRunId(representative.bundle);

			await given(
				'the fixture manifest describes a run with unexpected results',
				() => expect(representative.sampleNames.length).toBeGreaterThan(0)
			);
			await when(
				"I open the runs page filtered by that run's fixture tag",
				() => runsPage.gotoWithTagExpr(fixtureTagExpr(representative.bundle))
			);
			await and("I click the row's NOK badge", () => runsPage.openNok(runId));
			await then('the run page for that run is open', () =>
				runPage.expectLoaded(representative.expectedRun.name)
			);
			await and(
				'the tests with unexpected results are listed on the run page',
				async () => {
					for (const sampleName of representative.sampleNames) {
						await expect(page.getByText(sampleName).first()).toBeVisible({
							timeout: 15_000
						});
					}
				}
			);
		}
	);

	test('Applying a tag expression writes it to the URL', async ({ page }) => {
		const runsPage = new RunsPage(page);
		const { expectedRun } = representativeRun(requireManifest());

		await given(
			'I open the runs page for a date covered by the fixtures',
			async () => {
				await runsPage.gotoForDate(expectedRun.dashboardDate);
				await runsPage.expectReady();
			}
		);
		await when('I type a tag expression and submit the form', async () => {
			await runsPage.fillTagExpr('linux');
			await runsPage.submit();
		});
		await then('the tag expression is recorded in the URL', () =>
			expect(page).toHaveURL(/[?&]tagExpr=linux(?:&|$)/, { timeout: 15_000 })
		);
	});

	test('Resetting the form clears the filters from the URL', async ({
		page
	}) => {
		const runsPage = new RunsPage(page);
		const { expectedRun } = representativeRun(requireManifest());
		const date = expectedRun.dashboardDate;

		await given(
			'I open the runs page with a date range and a tag expression',
			async () => {
				const params = new URLSearchParams({
					startDate: date,
					finishDate: date,
					calendarMode: 'default',
					tagExpr: 'linux'
				});
				await page.goto(`runs?${params.toString()}`);
				await expect(page).toHaveURL(/tagExpr=linux/);
			}
		);
		await when('I reset the form', () => runsPage.resetForm());
		await then('the URL no longer carries the filters', async () => {
			await expect(page).not.toHaveURL(/tagExpr=/, { timeout: 15_000 });
			await expect(page).not.toHaveURL(/startDate=/);
			await expect(page).not.toHaveURL(/finishDate=/);
		});
	});

	// eslint-disable-next-line playwright/expect-expect
	test('A tag expression that matches nothing shows the empty state', async ({
		page
	}) => {
		const runsPage = new RunsPage(page);

		await when(
			'I open the runs page filtered by a tag that no run carries',
			() => runsPage.gotoWithTagExpr('fixture_id=no-such-fixture-run')
		);
		await then('the runs page shows the "No runs found" empty state', () =>
			runsPage.expectEmptyState()
		);
	});

	test('Selecting two runs offers comparison and multi-run views', async ({
		page
	}) => {
		const runsPage = new RunsPage(page);
		const pair = requireCapability(
			runPairOnSameDate(requireManifest()),
			'Fixture manifest contains no two imported runs sharing a date.'
		);
		const runIds = pair.bundles.map(importedRunId) as [number, number];

		await given('the fixture manifest describes two imported runs', () =>
			expect(new Set(runIds).size).toBe(2)
		);
		await when('I open the runs page covering both runs', async () => {
			await runsPage.gotoForDate(pair.date);
			await runsPage.expectTableLoaded();
		});
		await and('I select both rows', async () => {
			for (const runId of runIds) {
				await runsPage.expectRowVisible(runId);
				await runsPage.selectRow(runId);
			}
		});
		await then('the selection popover reports two selected runs', () =>
			runsPage.expectSelectedCount(2)
		);
		await and('it offers to open them in the multiple-runs view', () =>
			runsPage.expectMultipleOffered(runIds)
		);
		await and('it offers to compare them', () =>
			runsPage.expectCompareOffered(runIds)
		);
	});

	test(
		'Clicking a run tag badge filters the runs table and records it in the URL',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			let badge: DiscriminatingBadge;

			await given(
				'the runs table lists the runs imported on a fixture date',
				async () => {
					badge = await openWithDiscriminatingBadge(page, runsPage);
					expect(badge.withoutIt.length).toBeGreaterThan(0);
				}
			);
			await when('I click a tag badge that only some of those runs carry', () =>
				runsPage.clickBadge(badge.withIt[0], badge.column, badge.text)
			);
			await then('that tag is recorded in the URL as run data', () =>
				runsPage.expectRunDataContains(badge.payload)
			);
			await and('the URL is back on the first page', () =>
				runsPage.expectOnFirstPage()
			);
			await and('only the runs carrying that tag are listed', () =>
				runsPage.expectOnlyRunsListed(badge.withIt)
			);
			await and('the badge is shown as selected', () =>
				runsPage.expectBadgeSelected(badge.withIt[0], badge.column, badge.text)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking the same run tag badge again clears the run data filter',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			let badge: DiscriminatingBadge;

			await given('the runs table is filtered by a tag badge', async () => {
				badge = await openWithDiscriminatingBadge(page, runsPage);
				await runsPage.clickBadge(badge.withIt[0], badge.column, badge.text);
				await runsPage.expectRunDataContains(badge.payload);
				await runsPage.expectOnlyRunsListed(badge.withIt);
			});
			await when('I click that badge again', () =>
				runsPage.clickBadge(badge.withIt[0], badge.column, badge.text)
			);
			await then('the run data is dropped from the URL', () =>
				runsPage.expectNoRunData()
			);
			await and('the runs the badge had filtered out are listed again', () =>
				runsPage.expectRunsListed(badge.withoutIt)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking two badges of the same run combines both into the run data filter',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			let runId = 0;
			let importantBadge: DiscriminatingBadge;
			let metadataBadge: DiscriminatingBadge;

			await given(
				'the runs table lists the runs imported on a fixture date',
				async () => {
					await withBadgeFiltersApplied(page);
					await runsPage.gotoForDate(badgeDate());
					await runsPage.expectTableLoaded();

					importantBadge = await runsPage.pickDiscriminatingBadge(
						'important_tags'
					);
					metadataBadge = await runsPage.pickDiscriminatingBadge('Metadata');
					runId = requireCapability(
						importantBadge.withIt.find((id) =>
							metadataBadge.withIt.includes(id)
						),
						'No listed run carries both a discriminating important tag and a discriminating metadata value.'
					);
				}
			);
			await when('I click an important tag badge of a run', async () => {
				await runsPage.clickBadge(runId, 'important_tags', importantBadge.text);
				await runsPage.expectRunDataContains(importantBadge.payload);
			});
			await and('I click a metadata badge of the same run', () =>
				runsPage.clickBadge(runId, 'Metadata', metadataBadge.text)
			);
			await then('both values are recorded in the URL as run data', () =>
				runsPage.expectRunDataContains(
					importantBadge.payload,
					metadataBadge.payload
				)
			);
			await and('that run is still listed', () =>
				runsPage.expectRunsListed([runId])
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A run data filter in the link is reflected in the Metas field',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			let badge: DiscriminatingBadge;
			const date = badgeDate();

			await given(
				'a link that pins a run data value the fixture runs carry',
				async () => {
					badge = await openWithDiscriminatingBadge(page, runsPage);
				}
			);
			await when('I open that link', async () => {
				const params = new URLSearchParams({
					startDate: date,
					finishDate: date,
					calendarMode: 'default',
					mode: 'table',
					runData: badge.payload
				});
				await page.goto(`runs?${params.toString()}`);
				await runsPage.expectTableLoaded();
			});
			await then('the Metas field reports that value as selected', () =>
				runsPage.expectMetaSelected(badge.text)
			);
			await and('only the runs carrying it are listed', () =>
				runsPage.expectOnlyRunsListed(badge.withIt)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Selecting a meta in the Metas field filters the runs table on submit',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			let badge: DiscriminatingBadge;

			await given(
				'the runs table lists the runs imported on a fixture date',
				async () => {
					badge = await openWithDiscriminatingBadge(page, runsPage);
				}
			);
			await when(
				'I select a meta in the Metas field and submit the form',
				async () => {
					await runsPage.selectMeta(badge.payload, badge.text);
					await runsPage.submit();
				}
			);
			await then('that meta is recorded in the URL as run data', () =>
				runsPage.expectRunDataContains(badge.payload)
			);
			await and('only the runs carrying it are listed', () =>
				runsPage.expectOnlyRunsListed(badge.withIt)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Resetting the form clears the run data applied by a badge',
		{ tag: ['@runs'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			let badge: DiscriminatingBadge;

			await given('the runs table is filtered by a tag badge', async () => {
				badge = await openWithDiscriminatingBadge(page, runsPage);
				await runsPage.clickBadge(badge.withIt[0], badge.column, badge.text);
				await runsPage.expectRunDataContains(badge.payload);
			});
			await when('I reset the form', () => runsPage.resetForm());
			await then('the run data is dropped from the URL', () =>
				runsPage.expectNoRunData()
			);
			await and('the runs the badge had filtered out are listed again', () =>
				runsPage.expectRunsListed(badge.withoutIt)
			);
		}
	);

	test(
		'Submitting a tag expression keeps the run data applied by a badge',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			let badge: DiscriminatingBadge;

			await given('the runs table is filtered by a tag badge', async () => {
				badge = await openWithDiscriminatingBadge(page, runsPage);
				await runsPage.clickBadge(badge.withIt[0], badge.column, badge.text);
				await runsPage.expectRunDataContains(badge.payload);
			});
			await when('I type a tag expression and submit the form', async () => {
				await runsPage.fillTagExpr('linux');
				await runsPage.submit();
			});
			await then(
				'the URL carries both the tag expression and the run data',
				async () => {
					await expect(page).toHaveURL(/[?&]tagExpr=linux(?:&|$)/, {
						timeout: 15_000
					});
					await runsPage.expectRunDataContains(badge.payload);
				}
			);
		}
	);

	function runPair(): { date: string; runIds: [number, number] } {
		const pair = requireCapability(
			runPairOnSameDate(requireManifest()),
			'Fixture manifest contains no two imported runs sharing a date.'
		);

		return {
			date: pair.date,
			runIds: pair.bundles.map(importedRunId) as [number, number]
		};
	}

	async function selectPair(
		runsPage: RunsPage
	): Promise<{ date: string; runIds: [number, number] }> {
		const pair = runPair();

		await runsPage.gotoForDate(pair.date);
		await runsPage.expectTableLoaded();

		for (const runId of pair.runIds) {
			await runsPage.expectRowVisible(runId);
			await runsPage.selectRow(runId);
		}

		await runsPage.expectSelectedCount(2);

		return pair;
	}

	test(
		'A runs link restores the date range, the tag expression and the page size',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			const { bundle } = representativeRun(requireManifest());
			const date = requireCapability(
				bundle.expectedRuns[0]?.dashboardDate,
				'Fixture manifest contains no run with a dashboard date.'
			);
			const link = {
				startDate: date,
				finishDate: date,
				calendarMode: 'default',
				mode: 'table',
				pageSize: '10',
				tagExpr: fixtureTagExpr(bundle)
			};

			await given(
				'a link that pins a date range, a tag expression and a page size',
				() => expect(link.tagExpr).not.toBe('')
			);
			await when('I open that link', () => runsPage.gotoWithParams(link));
			await then('the runs table lists the runs of that range', async () => {
				await runsPage.expectTableLoaded();
				await runsPage.expectRowVisible(importedRunId(bundle));
			});
			await and('the form shows the tag expression the link pinned', () =>
				runsPage.expectTagExprInput(link.tagExpr)
			);
			await and(
				'the link still carries every parameter it was opened with',
				() => runsPage.expectParams(link)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Paging the runs table records the page and page size and survives a reload',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			const pair = runPair();

			await given(
				'I open the runs page for a date with more runs than fit on one page',
				async () => {
					await runsPage.gotoWithParams({
						startDate: pair.date,
						finishDate: pair.date,
						calendarMode: 'default',
						mode: 'table',
						pageSize: '1'
					});
					await runsPage.expectTableLoaded();
					await runsPage.expectPaginated();
				}
			);
			await when('I open the next page of runs', () => runsPage.openNextPage());
			await then('the page and the page size are recorded in the URL', () =>
				runsPage.expectParams({ page: '2', pageSize: '1' })
			);
			await when('I reload the page', () => page.reload());
			await then(
				'the page and the page size are still recorded in the URL',
				() => runsPage.expectParams({ page: '2', pageSize: '1' })
			);
			await and('the runs table is listing results again', () =>
				runsPage.expectTableLoaded()
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Submitting the runs form sends the table back to the first page',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			const { bundle } = representativeRun(requireManifest());
			const date = requireCapability(
				bundle.expectedRuns[0]?.dashboardDate,
				'Fixture manifest contains no run with a dashboard date.'
			);
			const tagExpr = fixtureTagExpr(bundle);

			await given('I open the second page of a runs query', async () => {
				await runsPage.gotoWithParams({
					startDate: date,
					finishDate: date,
					calendarMode: 'default',
					mode: 'table',
					page: '2',
					pageSize: '10'
				});
				await runsPage.expectParams({ page: '2' });
			});
			await when('I type a tag expression and submit the form', async () => {
				await runsPage.fillTagExpr(tagExpr);
				await runsPage.submit();
			});
			await then('the URL is back on the first page', () =>
				runsPage.expectOnFirstPage()
			);
			await and('the page size and the tag expression are pinned', () =>
				runsPage.expectParams({ pageSize: '10', tagExpr })
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Resetting the runs form drops the duration but keeps the calendar mode',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);

			await given(
				'I open the runs page with a duration window applied',
				async () => {
					await runsPage.gotoWithParams({
						calendarMode: 'duration',
						duration: 'P7D',
						mode: 'table'
					});
					await runsPage.expectReady();
				}
			);
			await when('I reset the form', () => runsPage.resetForm());
			await then('the duration is dropped from the URL', () =>
				runsPage.expectParams({ duration: null })
			);
			await and('the calendar mode is still recorded in the URL', () =>
				runsPage.expectCalendarMode('duration')
			);
		}
	);

	test(
		'A duration link overrides the dates pinned beside it',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			const link = {
				calendarMode: 'duration',
				duration: durationCoveringFixtures(requireManifest()),
				startDate: '2000-01-01',
				finishDate: '2000-01-02',
				mode: 'table'
			};

			await given(
				'a link that pins a duration alongside a stale date range',
				() => expect(link.duration).toMatch(/^P\d+D$/)
			);
			await when('I open that link', () => runsPage.gotoWithParams(link));
			await then('the runs table is listing results again', () =>
				runsPage.expectTableLoaded()
			);
			await and('the link still carries the duration and both dates', () =>
				runsPage.expectParams(link)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Selecting runs records the selection in the compressed sidebar state',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			let runIds: [number, number];

			await given(
				'the runs table lists two runs imported on a fixture date',
				async () => {
					const pair = runPair();
					runIds = pair.runIds;
					await runsPage.gotoForDate(pair.date);
					await runsPage.expectTableLoaded();
				}
			);
			await when('I select both rows', async () => {
				for (const runId of runIds) {
					await runsPage.expectRowVisible(runId);
					await runsPage.selectRow(runId);
				}
			});
			await then('the selection popover reports two selected runs', () =>
				runsPage.expectSelectedCount(2)
			);
			await and('the compressed sidebar state lists both run ids', () =>
				runsPage.selection.expectSelectedRunIds(runIds)
			);
			await and('no plain selection parameter is written to the URL', () =>
				runsPage.expectParamsAbsent(['selected', 'runIds', 'compare'])
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A selected pair of runs survives a reload of the runs page',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);
			let runIds: [number, number];

			await given('I have selected two runs in the runs table', async () => {
				runIds = (await selectPair(runsPage)).runIds;
			});
			await when('I reload the page', async () => {
				await page.reload();
				await runsPage.expectTableLoaded();
			});
			await then('the selection popover still reports two selected runs', () =>
				runsPage.expectSelectedCount(2)
			);
			await and('the compressed sidebar state still lists both run ids', () =>
				runsPage.selection.expectSelectedRunIds(runIds)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clearing the run selection removes it from the compressed sidebar state',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const runsPage = new RunsPage(page);

			await given('I have selected two runs in the runs table', () =>
				selectPair(runsPage)
			);
			await when('I clear the selection', () => runsPage.clearSelection());
			await then('the compressed sidebar state carries no selected runs', () =>
				runsPage.selection.expectNoSelection()
			);
			await and('nothing reports a selection any more', () =>
				runsPage.expectNothingSelected()
			);
		}
	);

	test.describe('The runs page renders every view mode', () => {
		test.slow();

		// eslint-disable-next-line playwright/expect-expect
		test('charts', async ({ page }) => {
			const runsPage = new RunsPage(page);

			await when('I open the runs page in the given mode', () =>
				runsPage.gotoWithMode('charts')
			);
			await then("the mode's own section is rendered", () =>
				runsPage.expectModeSection('charts')
			);
		});

		// eslint-disable-next-line playwright/expect-expect
		test('progress', async ({ page }) => {
			const runsPage = new RunsPage(page);

			await when('I open the runs page in the given mode', () =>
				runsPage.gotoWithMode('progress')
			);
			await then("the mode's own section is rendered", () =>
				runsPage.expectModeSection('progress')
			);
		});
	});
});
