/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/runs.feature */
import { expect, test } from '@playwright/test';

import { RunsPage } from './pages/runs-page';
import { RunPage } from './pages/run-page';
import { importedRunId } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';
import type { Bundle } from './support/manifest';
import {
	expectedNokCount,
	representativeNokRun,
	representativeRun,
	runPairOnSameDate
} from './support/sample-cases';

function fixtureTagExpr(bundle: Bundle): string {
	return `fixture_id=${bundle.e2eRunId}`;
}

test.describe('Runs Page', () => {
	// Assertions are encapsulated by RunsPage.
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
			await when("I open the runs page filtered by that run's fixture tag", () =>
				runsPage.gotoWithTagExpr(fixtureTagExpr(bundle))
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

	// Assertions are encapsulated by RunsPage.openLog.
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

	// Sorting is client-side over the current page. With a single fixture run the
	// order cannot change, so this guards that toggling the sort does not break
	// the table and keeps the run visible.
	// eslint-disable-next-line playwright/expect-expect
	test('Sorting by statistic summary keeps the run listed', async ({ page }) => {
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

	// Assertions are encapsulated by RunsPage.
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
			await when("I open the runs page filtered by that run's fixture tag", () =>
				runsPage.gotoWithTagExpr(fixtureTagExpr(representative.bundle))
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
			await when("I open the runs page filtered by that run's fixture tag", () =>
				runsPage.gotoWithTagExpr(fixtureTagExpr(representative.bundle))
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

		await given('I open the runs page for a date covered by the fixtures', async () => {
			await runsPage.gotoForDate(expectedRun.dashboardDate);
			await runsPage.expectReady();
		});
		await when('I type a tag expression and submit the form', async () => {
			await runsPage.fillTagExpr('linux');
			await runsPage.submit();
		});
		await then('the tag expression is recorded in the URL', () =>
			expect(page).toHaveURL(/[?&]tagExpr=linux(?:&|$)/, { timeout: 15_000 })
		);
	});

	test('Resetting the form clears the filters from the URL', async ({ page }) => {
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

	// Assertions are encapsulated by RunsPage.
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

	test.describe('The runs page renders every view mode', () => {
		test('charts', async ({ page }) => {
			const runsPage = new RunsPage(page);

			await when('I open the runs page in the given mode', () =>
				runsPage.gotoWithMode('charts')
			);
			await then("the mode's own section is rendered", () =>
				expect(page.getByText('Runs Stats').first()).toBeVisible({
					timeout: 30_000
				})
			);
		});

		test('progress', async ({ page }) => {
			const runsPage = new RunsPage(page);

			await when('I open the runs page in the given mode', () =>
				runsPage.gotoWithMode('progress')
			);
			await then("the mode's own section is rendered", () =>
				expect(page.getByText('Runs Progress').first()).toBeVisible({
					timeout: 30_000
				})
			);
		});
	});
});
