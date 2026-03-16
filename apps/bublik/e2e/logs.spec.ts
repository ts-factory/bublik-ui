/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Page, test } from '@playwright/test';

import { DashboardPage } from './pages/dashboard-page';
import { RunPage } from './pages/run-page';
import { BundleEntry, requireManifest } from './support/manifest';
import {
	representativeNokRun,
	representativeRun
} from './support/sample-cases';

function importedRunId(bundle: BundleEntry): number {
	if (!bundle.runId) {
		throw new Error(`Fixture run "${bundle.id}" has no imported runId.`);
	}
	return bundle.runId;
}

async function getRunDetails(page: Page, runId: number) {
	const response = await page.request.get(`/api/v2/runs/${runId}/details`);
	expect(response.ok()).toBeTruthy();
	return response.json() as Promise<{
		status: string;
		status_by_nok: string;
		conclusion: string;
		conclusion_reason?: string | null;
	}>;
}

test.describe('E2E: Imported Runs UI', () => {
	// Assertions are encapsulated by DashboardPage.
	// eslint-disable-next-line playwright/expect-expect
	test('dashboard contains a representative imported run', async ({ page }) => {
		const { bundle, expectedRun } = representativeRun(requireManifest());
		const dashboardPage = new DashboardPage(page);

		await dashboardPage.goto(expectedRun.dashboardDate);
		await dashboardPage.expectRunIdVisible(importedRunId(bundle));
	});

	// Assertions are encapsulated by RunPage.
	// eslint-disable-next-line playwright/expect-expect
	test('representative run page loads', async ({ page }) => {
		const { bundle, expectedRun } = representativeRun(requireManifest());
		const runPage = new RunPage(page);

		await runPage.goto(importedRunId(bundle));
		await runPage.expectLoaded(expectedRun.name);
	});

	test('representative NOK run renders preview samples', async ({ page }) => {
		const representative = representativeNokRun(requireManifest());
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(!representative, 'Fixture manifest contains no NOK samples.');
		// eslint-disable-next-line playwright/no-conditional-in-test
		if (!representative) return;

		const runPage = new RunPage(page);
		await runPage.goto(importedRunId(representative.bundle));
		await runPage.expectLoaded(representative.expectedRun.name);
		await runPage.previewNok();

		for (const sampleName of representative.sampleNames) {
			await expect(page.getByText(sampleName).first()).toBeVisible({
				timeout: 15_000
			});
		}
	});

	test('representative run details match the manifest', async ({ page }) => {
		const { bundle, expectedRun } = representativeRun(requireManifest());
		const details = await getRunDetails(page, importedRunId(bundle));

		expect(details.status).toBe(expectedRun.expectedStatus);
		expect(details.status_by_nok).toBe(expectedRun.expectedStatusByNok);
		expect(details.conclusion).toBe(expectedRun.expectedConclusion);
		expect(details.conclusion_reason ?? null).toBe(
			expectedRun.expectedConclusionReason ?? null
		);
	});

	// Assertions are encapsulated by DashboardPage.
	// eslint-disable-next-line playwright/expect-expect
	test('empty fixture date contains no generated runs', async ({ page }) => {
		const manifest = requireManifest();
		const emptyDate = manifest.emptyDates?.[0];
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(!emptyDate, 'Fixture manifest contains no empty date.');
		// eslint-disable-next-line playwright/no-conditional-in-test
		if (!emptyDate) return;

		const dashboardPage = new DashboardPage(page);
		await dashboardPage.goto(emptyDate);
		for (const bundle of manifest.bundles) {
			await dashboardPage.expectRunIdHidden(importedRunId(bundle));
		}
	});
});
