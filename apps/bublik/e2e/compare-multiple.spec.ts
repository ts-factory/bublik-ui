/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test';

import { LogPage } from './pages/log-page';
import { RunDiffPage } from './pages/run-diff-page';
import { RunMultiplePage } from './pages/run-multiple-page';
import { requireManifest } from './support/manifest';
import { importedRunId, representativeImportedRun } from './support/e2e-data';

function firstTwoRunIds(): [number, number] {
	const manifest = requireManifest();
	const ids = manifest.bundles
		.map((bundle) => bundle.runId)
		.filter((runId): runId is number => Number(runId) > 0);
	const first = ids[0] ?? importedRunId(manifest.bundles[0]);

	return [first, ids[1] ?? first];
}

test.describe('Compare and Multiple Pages', () => {
	test('compare page shows missing-runs state without query parameters', async ({
		page
	}) => {
		const comparePage = new RunDiffPage(page);

		await comparePage.goto();
		await comparePage.expectMissingRunsError();
	});

	test('compare page loads selected runs and links to a log page', async ({
		page
	}) => {
		const [leftRunId, rightRunId] = firstTwoRunIds();
		const comparePage = new RunDiffPage(page);
		const logPage = new LogPage(page);

		await comparePage.goto(leftRunId, rightRunId);
		await comparePage.expectLoaded();
		await comparePage.showInfoDiff();
		await comparePage.openLeftLog();
		await logPage.expectLoaded();
	});

	test('multiple page shows missing-runs state without query parameters', async ({
		page
	}) => {
		const multiplePage = new RunMultiplePage(page);

		await multiplePage.goto([]);
		await multiplePage.expectMissingRunsEmptyState();
	});

	test('multiple page switches selected run and links to its log', async ({
		page
	}) => {
		const [firstRunId, secondRunId] = firstTwoRunIds();
		const multiplePage = new RunMultiplePage(page);
		const logPage = new LogPage(page);

		await multiplePage.goto([firstRunId, secondRunId]);
		await multiplePage.expectLoaded();
		await multiplePage.selectRun(secondRunId);
		await multiplePage.openSelectedLog();
		await logPage.expectLoaded();
	});

	test('run page header opens the log page', async ({ page }) => {
		const runCase = representativeImportedRun(requireManifest());

		await page.goto(`runs/${runCase.runId}`);
		await page.getByRole('banner').getByRole('link', { name: /^Log$/ }).click();
		await expect(page).toHaveURL(new RegExp(`/log/${runCase.runId}`));
		await new LogPage(page).expectLoaded();
	});
});
