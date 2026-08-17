/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements features/run-compare.feature and features/run-multiple.feature */
/* Assertions are encapsulated by the page objects. */
/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test';

import { LogPage } from './pages/log-page';
import { RunDiffPage } from './pages/run-diff-page';
import { RunMultiplePage } from './pages/run-multiple-page';
import { RunPage } from './pages/run-page';
import { requireManifest } from './support/manifest';
import { requireCapability } from './support/capabilities';
import { importedRunId } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { representativeNokRun } from './support/sample-cases';

function firstTwoRunIds(): [number, number] {
	const manifest = requireManifest();
	const ids = [
		...new Set(
			manifest.bundles
				.map((bundle) => bundle.runId)
				.filter((runId): runId is number => Number(runId) > 0)
		)
	];
	if (ids.length < 2) {
		throw new Error(
			'Required E2E capability is missing: compare coverage requires two distinct imported run IDs.'
		);
	}

	return [ids[0], ids[1]];
}

test.describe('Compare Page', () => {
	test('Comparing without a run selection explains what is missing', async ({
		page
	}) => {
		const comparePage = new RunDiffPage(page);

		await when('I open the compare page without run parameters', () =>
			comparePage.goto()
		);
		await then('it reports that no runs are selected', () =>
			comparePage.expectMissingRunsError()
		);
	});

	test("Comparing two runs shows the diff and links to a run's log", async ({
		page
	}) => {
		const comparePage = new RunDiffPage(page);
		const logPage = new LogPage(page);
		const [leftRunId, rightRunId] = firstTwoRunIds();

		await given('the fixture manifest describes two imported runs', () =>
			expect(leftRunId).not.toBe(rightRunId)
		);
		await when('I open the compare page for both runs', () =>
			comparePage.goto(leftRunId, rightRunId)
		);
		await then('the diff is rendered', () => comparePage.expectLoaded());
		await when('I switch to the info diff', () => comparePage.showInfoDiff());
		await and("I follow the left run's Log link", () =>
			comparePage.openLeftLog()
		);
		await then('the log page is open', () => logPage.expectLoaded());
	});
});

test.describe('Multiple Runs Page', () => {
	test('Opening the multiple view without runs explains what is missing', async ({
		page
	}) => {
		const multiplePage = new RunMultiplePage(page);

		await when('I open the multiple page without run parameters', () =>
			multiplePage.goto([])
		);
		await then('it reports that the run ids are missing', () =>
			multiplePage.expectMissingRunsEmptyState()
		);
	});

	test('The multiple view switches which run is selected', async ({ page }) => {
		const multiplePage = new RunMultiplePage(page);
		const logPage = new LogPage(page);
		const [firstRunId, secondRunId] = firstTwoRunIds();

		await given('the fixture manifest describes two imported runs', () =>
			expect(firstRunId).not.toBe(secondRunId)
		);
		await when('I open the multiple page for both runs', async () => {
			await multiplePage.goto([firstRunId, secondRunId]);
			await multiplePage.expectLoaded();
		});
		await and('I select the second run', () =>
			multiplePage.selectRun(secondRunId)
		);
		await then('the selection is recorded in the URL', () =>
			expect(page).toHaveURL(new RegExp(`selected=${secondRunId}`))
		);
		await when("I follow the selected run's Log link", () =>
			multiplePage.openSelectedLog()
		);
		await then('the log page is open', () => logPage.expectLoaded());
	});

	test(
		'Preview NOK applies across the merged runs',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const multiplePage = new RunMultiplePage(page);
			const runPage = new RunPage(page);
			const representative = requireCapability(
				representativeNokRun(requireManifest()),
				'Fixture manifest contains no NOK samples.'
			);
			const nokRunId = importedRunId(representative.bundle);
			const otherRunId = firstTwoRunIds().find((id) => id !== nokRunId);

			await given(
				'I open the multiple page for a run with unexpected results',
				async () => {
					await multiplePage.goto(
						otherRunId ? [nokRunId, otherRunId] : [nokRunId]
					);
					await multiplePage.expectLoaded();
				}
			);
			await when('I press Preview NOK', () => runPage.previewNok());
			await then('the tests with unexpected results are listed', async () => {
				for (const sampleName of representative.sampleNames) {
					await expect(page.getByText(sampleName).first()).toBeVisible({
						timeout: 15_000
					});
				}
			});
		}
	);
});
