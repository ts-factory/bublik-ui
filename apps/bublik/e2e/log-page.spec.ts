/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test';

import { LogPage } from './pages/log-page';
import { requireManifest } from './support/manifest';
import {
	firstErrorResultNode,
	firstMeasurementResultNode,
	firstResultNode,
	importedRunId,
	representativeImportedRun,
	skipIfMissing
} from './support/e2e-data';
import { representativeNokRun } from './support/sample-cases';

test.describe('Log Page', () => {
	test('renders mode-specific tree and info panels', async ({ page }) => {
		const runCase = representativeImportedRun(requireManifest());
		const logPage = new LogPage(page);

		await logPage.goto(runCase.runId, 'mode=treeAndinfoAndlog');
		await logPage.expectLoaded();
		await logPage.expectTreeVisible();
		await logPage.expectInfoVisible();

		await logPage.goto(runCase.runId, 'mode=log');
		await logPage.expectLoaded();
		await logPage.expectTreeHidden();
		await logPage.expectInfoHidden();
	});

	test('loads a focused result and can return to the run log', async ({
		page,
		request
	}) => {
		const runCase = representativeImportedRun(requireManifest());
		const result = skipIfMissing(
			await firstResultNode(request, runCase),
			'Fixture tree contains no test result node.'
		);
		const logPage = new LogPage(page);

		await logPage.goto(
			runCase.runId,
			`mode=treeAndlog&focusId=${result.node.id}`
		);
		await logPage.expectLoaded();
		await logPage.expectTreeVisible();
		await logPage.expectFocusedTreeItem(result.node.id);
		await logPage.expectJsonLogVisible();

		await logPage.showRunLog();
		await logPage.expectJsonLogVisible();
	});

	test('toggles NOK-only tree and scrolls to a focused error result', async ({
		page,
		request
	}) => {
		const representative = skipIfMissing(
			representativeNokRun(requireManifest()),
			'Fixture manifest contains no NOK samples.'
		);
		const runCase = {
			bundle: representative.bundle,
			expectedRun: representative.expectedRun,
			runId: importedRunId(representative.bundle)
		};
		const result = skipIfMissing(
			await firstErrorResultNode(request, runCase),
			'Fixture tree contains no error result node.'
		);
		const logPage = new LogPage(page);

		await logPage.goto(
			runCase.runId,
			`mode=treeAndlog&focusId=${result.node.id}`
		);
		await logPage.expectLoaded();
		await logPage.toggleOnlyNok();
		await logPage.scrollToFocus();
		await logPage.expectFocusedTreeItem(result.node.id);
	});

	test('switches between JSON and legacy log renderers', async ({ page }) => {
		const runCase = representativeImportedRun(requireManifest());
		const logPage = new LogPage(page);

		await logPage.goto(runCase.runId);
		await logPage.expectJsonLogVisible();

		await logPage.toggleLegacyLog();
		await expect(page).toHaveURL(/legacy=true/, { timeout: 15_000 });
		await logPage.expectLegacyLogVisible();

		await logPage.toggleLegacyLog();
		await expect(page).toHaveURL(/legacy=false/, { timeout: 15_000 });
		await logPage.expectJsonLogVisible();
	});

	test('bookmarks log table line location and preserves focused result', async ({
		page,
		request
	}) => {
		const runCase = representativeImportedRun(requireManifest());
		const result = skipIfMissing(
			await firstResultNode(request, runCase),
			'Fixture tree contains no test result node.'
		);
		const logPage = new LogPage(page);

		await logPage.goto(runCase.runId, `focusId=${result.node.id}`);
		await logPage.expectJsonLogVisible();
		const line = await logPage.bookmarkFirstLine();

		await page.reload();
		await logPage.expectJsonLogVisible();
		await expect(page).toHaveURL(new RegExp(`lineNumber=.*_${line}`), {
			timeout: 15_000
		});
	});

	test('opens measurements from a focused result when fixture data supports it', async ({
		page,
		request
	}) => {
		const result = skipIfMissing(
			await firstMeasurementResultNode(request, requireManifest()),
			'Fixture manifest contains no result with measurements.'
		);
		const logPage = new LogPage(page);

		await logPage.goto(
			result.runCase.runId,
			`mode=treeAndinfoAndlog&focusId=${result.node.id}`
		);
		await logPage.expectLoaded();
		await logPage.openFocusedResultMeasurements();
		await expect(page).toHaveURL(/\/measurements(?:$|\?)/, {
			timeout: 15_000
		});
	});
});
