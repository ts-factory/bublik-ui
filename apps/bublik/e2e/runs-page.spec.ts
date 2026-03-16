/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from '@playwright/test';

import { RunsPage } from './pages/runs-page';
import { BundleEntry, requireManifest } from './support/manifest';
import { representativeRun } from './support/sample-cases';

function importedRunId(bundle: BundleEntry): number {
	if (!bundle.runId) {
		throw new Error(`Fixture run "${bundle.id}" has no imported runId.`);
	}
	return bundle.runId;
}

function fixtureTagExpr(bundle: BundleEntry): string {
	return `fixture_id=${bundle.e2eRunId}`;
}

test.describe('Runs Page', () => {
	test.describe('Table navigation & links', () => {
		// Assertions are encapsulated by RunsPage.
		// eslint-disable-next-line playwright/expect-expect
		test('table lists a representative imported run', async ({ page }) => {
			const { bundle } = representativeRun(requireManifest());
			const runsPage = new RunsPage(page);

			await runsPage.gotoWithTagExpr(fixtureTagExpr(bundle));
			await runsPage.expectTableLoaded();
			await runsPage.expectRowVisible(importedRunId(bundle));
		});

		test('Run link opens the run details page', async ({ page }) => {
			const { bundle } = representativeRun(requireManifest());
			const runId = importedRunId(bundle);
			const runsPage = new RunsPage(page);

			await runsPage.gotoWithTagExpr(fixtureTagExpr(bundle));
			await runsPage.expectRowVisible(runId);
			await runsPage.openRun(runId);

			await expect(page.getByTestId('run-table')).toBeVisible({
				timeout: 30_000
			});
		});

		// Assertions are encapsulated by RunsPage.openLog.
		// eslint-disable-next-line playwright/expect-expect
		test('Log link opens the log page', async ({ page }) => {
			const { bundle } = representativeRun(requireManifest());
			const runsPage = new RunsPage(page);

			await runsPage.gotoWithTagExpr(fixtureTagExpr(bundle));
			await runsPage.expectTableLoaded();
			await runsPage.openLog(importedRunId(bundle));
		});

		// Sorting is client-side over the current page. With a single fixture run
		// the order can't change, so this only guards that toggling the sort does
		// not break the table and keeps the run visible.
		// eslint-disable-next-line playwright/expect-expect
		test('sorting by statistic summary keeps the table healthy', async ({
			page
		}) => {
			const { bundle } = representativeRun(requireManifest());
			const runsPage = new RunsPage(page);

			await runsPage.gotoWithTagExpr(fixtureTagExpr(bundle));
			await runsPage.expectTableLoaded();

			await runsPage.sortBySummary();
			await runsPage.expectTableLoaded();
			await runsPage.expectRowVisible(importedRunId(bundle));
		});
	});

	test.describe('Form filtering & URL sync', () => {
		test('tag expression filter writes tagExpr to the URL', async ({
			page
		}) => {
			const { expectedRun } = representativeRun(requireManifest());
			const runsPage = new RunsPage(page);

			await runsPage.gotoForDate(expectedRun.dashboardDate);
			await runsPage.expectReady();

			await runsPage.fillTagExpr('linux');
			await runsPage.submit();

			await expect(page).toHaveURL(/[?&]tagExpr=linux(?:&|$)/, {
				timeout: 15_000
			});
		});

		test('reset clears filters from the URL', async ({ page }) => {
			const { expectedRun } = representativeRun(requireManifest());
			const runsPage = new RunsPage(page);

			const date = expectedRun.dashboardDate;
			const params = new URLSearchParams({
				startDate: date,
				finishDate: date,
				calendarMode: 'default',
				tagExpr: 'linux'
			});
			await page.goto(`runs?${params.toString()}`);
			await expect(page).toHaveURL(/tagExpr=linux/);

			await runsPage.resetForm();

			await expect(page).not.toHaveURL(/tagExpr=/, { timeout: 15_000 });
			await expect(page).not.toHaveURL(/startDate=/);
			await expect(page).not.toHaveURL(/finishDate=/);
		});
	});
});
