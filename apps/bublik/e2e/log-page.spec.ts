/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/log.feature */
/* Assertions are encapsulated by LogPage. */
/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test';

import { LogPage } from './pages/log-page';
import { requireManifest } from './support/manifest';
import { requireCapability } from './support/capabilities';
import {
	firstErrorResultNode,
	firstMeasurementResultNode,
	firstResultNode,
	importedRunId,
	representativeImportedRun
} from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { representativeNokRun } from './support/sample-cases';

test.describe('Log Page', () => {
	test('The log layout follows the selected mode', { tag: ['@smoke'] }, async ({
		page
	}) => {
		const runCase = representativeImportedRun(requireManifest());
		const logPage = new LogPage(page);

		await given('the fixture manifest describes an imported run', () =>
			expect(runCase.runId).toBeGreaterThan(0)
		);
		await when('I open its log in the tree-and-info mode', async () => {
			await logPage.goto(runCase.runId, 'mode=treeAndinfoAndlog');
			await logPage.expectLoaded();
		});
		await then('both the tree and the info panel are shown', async () => {
			await logPage.expectTreeVisible();
			await logPage.expectInfoVisible();
		});
		await when('I open its log in the log-only mode', async () => {
			await logPage.goto(runCase.runId, 'mode=log');
			await logPage.expectLoaded();
		});
		await then('neither the tree nor the info panel is shown', async () => {
			await logPage.expectTreeHidden();
			await logPage.expectInfoHidden();
		});
	});

	test("Focusing a tree item loads that result's log", async ({
		page,
		request
	}) => {
		const runCase = representativeImportedRun(requireManifest());
		const logPage = new LogPage(page);
		const result = requireCapability(
			await firstResultNode(request, runCase),
			'Fixture tree contains no test result node.'
		);

		await given("the run's tree contains a test result", () =>
			expect(result.node.id).toBeTruthy()
		);
		await when('I open the log focused on that result', async () => {
			await logPage.goto(
				runCase.runId,
				`mode=treeAndlog&focusId=${result.node.id}`
			);
			await logPage.expectLoaded();
			await logPage.expectTreeVisible();
		});
		await then('the tree marks that result as focused', () =>
			logPage.expectFocusedTreeItem(result.node.id)
		);
		await and('the JSON log is rendered', () => logPage.expectJsonLogVisible());
		await when('I go back to the run log', () => logPage.showRunLog());
		await then('the JSON log is rendered', () => logPage.expectJsonLogVisible());
	});

	test(
		'The NOK-only tree keeps the focused error result reachable',
		{ tag: ['@needs-nok'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const representative = requireCapability(
				representativeNokRun(requireManifest()),
				'Fixture manifest contains no NOK samples.'
			);
			const runCase = {
				bundle: representative.bundle,
				expectedRun: representative.expectedRun,
				runId: importedRunId(representative.bundle)
			};
			const result = requireCapability(
				await firstErrorResultNode(request, runCase),
				'Fixture tree contains no error result node.'
			);

			await given(
				'a run with unexpected results has an error result in its tree',
				() => expect(result.node.id).toBeTruthy()
			);
			await when('I open the log focused on that error result', async () => {
				await logPage.goto(
					runCase.runId,
					`mode=treeAndlog&focusId=${result.node.id}`
				);
				await logPage.expectLoaded();
			});
			await and('I turn on the NOK-only tree', () => logPage.toggleOnlyNok());
			await and('I scroll to the focused result', () => logPage.scrollToFocus());
			await then('the tree marks that result as focused', () =>
				logPage.expectFocusedTreeItem(result.node.id)
			);
		}
	);

	test('The legacy toggle switches the log renderer', async ({ page }) => {
		const runCase = representativeImportedRun(requireManifest());
		const logPage = new LogPage(page);

		await given('I open the log of an imported run', () =>
			logPage.goto(runCase.runId)
		);
		await then('the JSON log is rendered', () => logPage.expectJsonLogVisible());
		await when('I turn on the legacy log', async () => {
			await logPage.toggleLegacyLog();
			await expect(page).toHaveURL(/legacy=true/, { timeout: 15_000 });
		});
		await then('the legacy log frame is shown', () =>
			logPage.expectLegacyLogVisible()
		);
		await when('I turn off the legacy log', async () => {
			await logPage.toggleLegacyLog();
			await expect(page).toHaveURL(/legacy=false/, { timeout: 15_000 });
		});
		await then('the JSON log is rendered', () => logPage.expectJsonLogVisible());
	});

	test('Bookmarking a log line survives a reload', async ({ page, request }) => {
		const runCase = representativeImportedRun(requireManifest());
		const logPage = new LogPage(page);
		const result = requireCapability(
			await firstResultNode(request, runCase),
			'Fixture tree contains no test result node.'
		);
		let line = '1';

		await given('I open the log focused on a test result', async () => {
			await logPage.goto(runCase.runId, `focusId=${result.node.id}`);
			await logPage.expectJsonLogVisible();
		});
		await when('I click a log line number', async () => {
			line = await logPage.bookmarkFirstLine();
		});
		await and('I reload the page', async () => {
			await page.reload();
			await logPage.expectJsonLogVisible();
		});
		await then('the bookmarked line is still recorded in the URL', () =>
			expect(page).toHaveURL(new RegExp(`lineNumber=.*_${line}`), {
				timeout: 15_000
			})
		);
	});

	test(
		'A result with measurements links to its measurements page',
		{ tag: ['@needs-measurements'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const result = requireCapability(
				await firstMeasurementResultNode(request, requireManifest()),
				'Fixture manifest contains no result with measurements.'
			);

			await given('the fixture manifest describes a result with measurements', () =>
				expect(result.node.id).toBeTruthy()
			);
			await when('I open the log focused on that result', async () => {
				await logPage.goto(
					result.runCase.runId,
					`mode=treeAndinfoAndlog&focusId=${result.node.id}`
				);
				await logPage.expectLoaded();
			});
			await and('I follow the Result link', () =>
				logPage.openFocusedResultMeasurements()
			);
			await then('the measurements page is open', () =>
				expect(page).toHaveURL(/\/measurements(?:$|\?)/, { timeout: 15_000 })
			);
		}
	);
});
