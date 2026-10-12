/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

import { HistoryPage } from './pages/history-page';
import { requireCapability } from './support/capabilities';
import { representativeImportedRun } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import {
	historyDateRange,
	historyTestPathForProject
} from './support/sample-cases';

const URL_TAG = { tag: ['@history', '@url-params'] };

function fixtureSearch(): { testPath: string; search: string } {
	const manifest = requireManifest();
	const runCase = representativeImportedRun(manifest);
	const testPath = requireCapability(
		historyTestPathForProject(manifest, runCase.bundle.project),
		`Project "${runCase.bundle.project}" has no sampled test path.`
	);
	const params = new URLSearchParams({
		testName: testPath,
		...historyDateRange(manifest),
		mode: 'linear'
	});

	return { testPath, search: params.toString() };
}

async function openV2(page: Page, search: string): Promise<HistoryPage> {
	const historyPage = new HistoryPage(page);

	await page.goto(`history/v2?${search}`);
	await expect(page).toHaveURL(/\/history\/v2\?/);
	await historyPage.expectReady();
	await expect(historyPage.root).toHaveAttribute(
		'data-history-mode',
		'linear',
		{
			timeout: 30_000
		}
	);
	// A result row, by the Log link every row carries.
	await expect(
		historyPage.root.getByRole('link', { name: 'Log', exact: true }).first()
	).toBeVisible({ timeout: 60_000 });

	return historyPage;
}

test.describe('History v2 alias', () => {
	test(
		'The v2 alias renders the history page at its own address',
		URL_TAG,
		async ({ page }) => {
			const { testPath, search } = fixtureSearch();
			let historyPage: HistoryPage;

			await given('a v2 history link for a fixture test path', () =>
				expect(search).toContain('testName=')
			);
			await when('I open that link', async () => {
				historyPage = await openV2(page, search);
			});
			await then('the history results for that test path are shown', () =>
				historyPage.expectParams({ testName: testPath })
			);
			await and('the address is still the v2 alias', () =>
				expect(page).toHaveURL(/\/history\/v2\?/)
			);
		}
	);

	test(
		'Applying a search from the v2 alias lands on the canonical history address',
		URL_TAG,
		async ({ page }) => {
			const { testPath, search } = fixtureSearch();
			let historyPage: HistoryPage;

			await given('the history page is open through the v2 alias', async () => {
				historyPage = await openV2(page, search);
			});
			await when('I apply the search for the same test path', () =>
				historyPage.searchForTestPath(testPath)
			);
			await then('the canonical history address is open', () =>
				expect(page).toHaveURL(/\/history\?/, { timeout: 30_000 })
			);
			await and('the test path is still pinned', () =>
				historyPage.expectParams({ testName: testPath })
			);
		}
	);
});
