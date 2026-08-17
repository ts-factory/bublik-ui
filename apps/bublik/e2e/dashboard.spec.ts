/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/dashboard.feature */
import { expect, test } from '@playwright/test';

import { DashboardPage } from './pages/dashboard-page';
import { RunPage } from './pages/run-page';
import { dashboardCellDestination, importedRunId } from './support/e2e-data';
import { and, but, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';
import {
	expectedNokCount,
	representativeNokRun,
	representativeRun
} from './support/sample-cases';

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
	test('Dashboard lists the runs imported for a date', async ({ page }) => {
		const dashboard = new DashboardPage(page);
		const { expectedRun, runId } = anyRun();

		await given(
			'the fixture manifest describes a run with a dashboard date',
			() => expect(expectedRun.dashboardDate).toBeTruthy()
		);
		await when('I open the dashboard for that date', () =>
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
	});

	test('Dashboard shows an empty state for a date without runs', async ({
		page
	}) => {
		const dashboard = new DashboardPage(page);
		const manifest = requireManifest();
		const emptyDate = requireCapability(
			manifest.emptyDates[0],
			'Fixture manifest contains no empty date.'
		);

		await given('the fixture manifest declares a date with no runs', () =>
			expect(emptyDate).toBeTruthy()
		);
		await when('I open the dashboard for that date', () =>
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
	});

	test(
		'NOK counter reports the number of unexpected results from the manifest',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const { expectedRun, runId, nokCount } = nokRun();

			await given(
				'the fixture manifest describes a run with unexpected results',
				() => expect(nokCount).toBeGreaterThan(0)
			);
			await when("I open the dashboard for that run's date", () =>
				dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' })
			);
			await then(
				"the run's NOK counter equals the unexpected result count from the manifest",
				() => dashboard.expectCellValue(runId, 'unexpected', String(nokCount))
			);
		}
	);

	test(
		'Clicking the NOK counter opens the run with unexpected rows previewed',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const runPage = new RunPage(page);
			const { expectedRun, runId, sampleNames } = nokRun();

			await given(
				'the fixture manifest describes a run with unexpected results',
				() => expect(sampleNames.length).toBeGreaterThan(0)
			);
			await when("I open the dashboard for that run's date", () =>
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
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const dashboard = new DashboardPage(page);
			const runPage = new RunPage(page);
			const { expectedRun, runId, sampleNames } = nokRun();

			await given(
				'the fixture manifest describes a run with unexpected results',
				() => expect(sampleNames.length).toBeGreaterThan(0)
			);
			await when("I open the dashboard for that run's date", () =>
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

	test('Clicking the total counter follows the destination the dashboard declares', async ({
		page,
		request
	}) => {
		const dashboard = new DashboardPage(page);
		const { expectedRun, runId } = anyRun();
		let destination = /never/;

		await given(
			"the dashboard API declares a destination for the run's total counter",
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
		await when('I open the dashboard for that date', () =>
			dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' })
		);
		await and("I click the run's total counter", () =>
			dashboard.openCell(runId, 'total', destination)
		);
		await then('that declared destination is open', () =>
			expect(page).toHaveURL(destination)
		);
	});

	// Assertions are encapsulated by DashboardPage.
	// eslint-disable-next-line playwright/expect-expect
	test("Expanding a dashboard row reveals the run's pass rate history", async ({
		page
	}) => {
		const dashboard = new DashboardPage(page);
		const { expectedRun, runId } = anyRun();

		await given(
			'the fixture manifest describes a run with a dashboard date',
			() => expect(expectedRun.dashboardDate).toBeTruthy()
		);
		await when('I open the dashboard for that date', async () => {
			await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
			await dashboard.expectRunIdVisible(runId);
		});
		await and("I expand the run's row", () => dashboard.expandRow(runId));
		await then("the row's pass rate history is shown", () =>
			dashboard.expectSubrowVisible(runId)
		);
		await when("I collapse the run's row", () => dashboard.collapseRow(runId));
		await then("the row's pass rate history is hidden", () =>
			dashboard.expectSubrowHidden(runId)
		);
	});

	// Assertions are encapsulated by DashboardPage.
	// eslint-disable-next-line playwright/expect-expect
	test('Searching the dashboard narrows the table to matching runs', async ({
		page
	}) => {
		const dashboard = new DashboardPage(page);
		const { expectedRun, runId } = anyRun();

		await given(
			'the fixture manifest describes a run with a dashboard date',
			() => expect(expectedRun.dashboardDate).toBeTruthy()
		);
		await when('I open the dashboard for that date', async () => {
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
	});

	// Assertions are encapsulated by DashboardPage.
	// eslint-disable-next-line playwright/expect-expect
	test('Switching the layout mode shows two days side by side', async ({
		page
	}) => {
		const dashboard = new DashboardPage(page);
		const { expectedRun, runId } = anyRun();

		await given(
			'the fixture manifest describes a run with a dashboard date',
			() => expect(expectedRun.dashboardDate).toBeTruthy()
		);
		await when('I open the dashboard for that date', async () => {
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
	});

	// Assertions are encapsulated by DashboardPage.
	// eslint-disable-next-line playwright/expect-expect
	test('The Today button returns the dashboard to the current day', async ({
		page
	}) => {
		const dashboard = new DashboardPage(page);
		const { expectedRun, runId } = anyRun();

		await given(
			'the fixture manifest describes a run with a dashboard date',
			() => expect(expectedRun.dashboardDate).toBeTruthy()
		);
		await when('I open the dashboard for that date', async () => {
			await dashboard.goto(expectedRun.dashboardDate, { mode: 'rows' });
			await dashboard.expectRunIdVisible(runId);
		});
		await and('I press the Today button', () => dashboard.clickToday());
		await then('the dashboard URL no longer pins a date', () =>
			dashboard.expectDateNotPinned()
		);
	});
});
