/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { test } from '@playwright/test';

import { MeasurementsPage } from './pages/measurements-page';
import { RunReportPage } from './pages/run-report-page';
import { requireManifest } from './support/manifest';
import {
	firstMeasurementResultNode,
	firstReportConfig,
	representativeImportedRun,
	skipIfMissing
} from './support/e2e-data';

test.describe('Report and Measurements Pages', () => {
	test('report page shows missing-config empty state', async ({ page }) => {
		const runCase = representativeImportedRun(requireManifest());
		const reportPage = new RunReportPage(page);

		await reportPage.goto(runCase.runId);
		await reportPage.expectMissingConfig();
	});

	test('report page loads the first configured report', async ({ page }) => {
		const runCase = representativeImportedRun(requireManifest());
		const config = skipIfMissing(
			await firstReportConfig(page, runCase.runId),
			'Fixture setup did not create a report config for this run.'
		);
		const reportPage = new RunReportPage(page);

		await reportPage.goto(runCase.runId, config.id);
		await reportPage.expectLoaded();
	});

	test('measurements page loads all supported route modes', async ({
		page,
		request
	}) => {
		const result = skipIfMissing(
			await firstMeasurementResultNode(request, requireManifest()),
			'Fixture manifest contains no result with measurements.'
		);
		const measurementsPage = new MeasurementsPage(page);

		for (const mode of ['default', 'charts', 'tables', 'split', 'overlay']) {
			await measurementsPage.goto(
				result.runCase.runId,
				result.node.id,
				`mode=${mode}`
			);
			await measurementsPage.expectLoaded(mode);
		}
	});

	test('measurements header links back to run and log pages', async ({
		page,
		request
	}) => {
		const result = skipIfMissing(
			await firstMeasurementResultNode(request, requireManifest()),
			'Fixture manifest contains no result with measurements.'
		);
		const measurementsPage = new MeasurementsPage(page);

		await measurementsPage.goto(result.runCase.runId, result.node.id);
		await measurementsPage.expectLoaded();
		await measurementsPage.openLog();

		await measurementsPage.goto(result.runCase.runId, result.node.id);
		await measurementsPage.expectLoaded();
		await measurementsPage.openRun();
	});
});
