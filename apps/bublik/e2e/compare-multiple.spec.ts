/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';

import { LogPage } from './pages/log-page';
import { RunDiffPage } from './pages/run-diff-page';
import { RunMultiplePage } from './pages/run-multiple-page';
import { RunPage } from './pages/run-page';
import { requireManifest } from './support/manifest';
import { requireCapability } from './support/capabilities';
import { importedRunId } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import {
	representativeNokRun,
	runPairOnSameDate
} from './support/sample-cases';

function comparableRunIds(): [number, number] {
	const pair = requireCapability(
		runPairOnSameDate(requireManifest()),
		'Fixture manifest contains no two runs sharing a project and a date.'
	);

	return [importedRunId(pair.bundles[0]), importedRunId(pair.bundles[1])];
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
		const [leftRunId, rightRunId] = comparableRunIds();

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

	test(
		'Toggling a row in the comparison is recorded in the URL and survives a reload',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const comparePage = new RunDiffPage(page);
			const [leftRunId, rightRunId] = comparableRunIds();
			let before = 0;
			let after = 0;

			await given('I open the compare page for two runs', async () => {
				await comparePage.goto(leftRunId, rightRunId);
				await comparePage.expectLoaded();
				before = await comparePage.rowCount();
				expect(before).toBeGreaterThan(0);
			});
			await when('I toggle the first row of the diff', () =>
				comparePage.toggleFirstRow()
			);
			await then('the diff records the expanded rows in the URL', () =>
				comparePage.expectParamsPresent(['expanded'])
			);
			await and('the rows it renders have changed', async () => {
				await expect
					.poll(() => comparePage.rowCount(), {
						timeout: 30_000,
						message: 'rows after toggling the first one'
					})
					.not.toBe(before);
				after = await comparePage.rowCount();
			});
			await when('I reload the page', async () => {
				await page.reload();
				await comparePage.expectLoaded();
			});
			await then('the diff renders the same rows again', () =>
				comparePage.expectRowCount(after)
			);
		}
	);

	test(
		'A compare link restores both sides it names',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const comparePage = new RunDiffPage(page);
			const [leftRunId, rightRunId] = comparableRunIds();
			const link = { left: String(leftRunId), right: String(rightRunId) };

			await given('a link that pins two runs to compare', () =>
				expect(leftRunId).not.toBe(rightRunId)
			);
			await when('I open that link', () => comparePage.gotoWithParams(link));
			await then('the diff is rendered', () => comparePage.expectLoaded());
			await and('the link still carries both sides', () =>
				comparePage.expectParams(link)
			);
		}
	);
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
		const [firstRunId, secondRunId] = comparableRunIds();

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
			const otherRunId = comparableRunIds().find((id) => id !== nokRunId);

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

	test(
		'A multiple-runs link restores every run it pins and the one it selected',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const multiplePage = new RunMultiplePage(page);
			const [firstRunId, secondRunId] = comparableRunIds();

			await given('a link that pins two runs and selects the second', () =>
				expect(firstRunId).not.toBe(secondRunId)
			);
			await when('I open that link', async () => {
				await multiplePage.gotoWithParams({
					runIds: [String(firstRunId), String(secondRunId)],
					selected: String(secondRunId)
				});
				await multiplePage.expectLoaded();
			});
			await then('the merged tree of both runs is shown', () =>
				multiplePage.expectLoaded()
			);
			await and(
				'the link still repeats both run ids and names the selection',
				async () => {
					await multiplePage.expectRunIdsPinned([firstRunId, secondRunId]);
					await multiplePage.expectParams({ selected: String(secondRunId) });
				}
			);
		}
	);

	test(
		'The multiple view falls back to the first run when the link names no selection',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const multiplePage = new RunMultiplePage(page);
			const [firstRunId, secondRunId] = comparableRunIds();

			await given('a link that pins two runs without naming a selection', () =>
				expect(firstRunId).not.toBe(secondRunId)
			);
			await when('I open that link', async () => {
				await multiplePage.gotoWithParams({
					runIds: [String(firstRunId), String(secondRunId)]
				});
				await multiplePage.expectLoaded();
			});
			await then('the merged tree of both runs is shown', () =>
				multiplePage.expectLoaded()
			);
			await and('no selection is written to the URL', () =>
				multiplePage.expectParams({ selected: null })
			);
			await when('I select the second run', () =>
				multiplePage.selectRun(secondRunId)
			);
			await then('the selection is recorded in the URL', () =>
				multiplePage.expectParams({ selected: String(secondRunId) })
			);
			await and('both run ids are still pinned', () =>
				multiplePage.expectRunIdsPinned([firstRunId, secondRunId])
			);
		}
	);
});
