/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { MeasurementsPage } from './pages/measurements-page';
import { requireManifest } from './support/manifest';
import { requireCapability } from './support/capabilities';
import { firstMeasurementResultNode } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';

test.describe('Measurements Page', () => {
	test.describe('The measurements page renders every layout mode', () => {
		async function expectModeRendered(
			page: Page,
			request: APIRequestContext,
			mode: string
		) {
			const measurementsPage = new MeasurementsPage(page);
			const result = requireCapability(
				await firstMeasurementResultNode(request, requireManifest()),
				'Fixture manifest contains no result with measurements.'
			);

			await when('I open the measurements page in the given mode', () =>
				measurementsPage.goto(
					result.runCase.runId,
					result.node.id,
					`mode=${mode}`
				)
			);
			await then('the page reports that mode as its layout', () =>
				measurementsPage.expectLoaded(mode)
			);
		}

		/* eslint-disable playwright/expect-expect */
		test('default', { tag: ['@needs-measurements'] }, ({ page, request }) =>
			expectModeRendered(page, request, 'default')
		);

		test('charts', { tag: ['@needs-measurements'] }, ({ page, request }) =>
			expectModeRendered(page, request, 'charts')
		);

		test('tables', { tag: ['@needs-measurements'] }, ({ page, request }) =>
			expectModeRendered(page, request, 'tables')
		);

		test('split', { tag: ['@needs-measurements'] }, ({ page, request }) =>
			expectModeRendered(page, request, 'split')
		);

		test('overlay', { tag: ['@needs-measurements'] }, ({ page, request }) =>
			expectModeRendered(page, request, 'overlay')
		);
		/* eslint-enable playwright/expect-expect */
	});

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The measurements header links back to the run and the log',
		{ tag: ['@needs-measurements'] },
		async ({ page, request }) => {
			const measurementsPage = new MeasurementsPage(page);
			const result = requireCapability(
				await firstMeasurementResultNode(request, requireManifest()),
				'Fixture manifest contains no result with measurements.'
			);

			await when('I open the measurements page', async () => {
				await measurementsPage.goto(result.runCase.runId, result.node.id);
				await measurementsPage.expectLoaded();
			});
			await and('I follow the Log link', () => measurementsPage.openLog());
			await then('the log page is open', () =>
				expect(page).toHaveURL(/\/log\/\d+/)
			);
			await when('I open the measurements page again', async () => {
				await measurementsPage.goto(result.runCase.runId, result.node.id);
				await measurementsPage.expectLoaded();
			});
			await and('I follow the Run link', () => measurementsPage.openRun());
			await then('the run page is open', () =>
				expect(page).toHaveURL(/\/runs\/\d+/)
			);
		}
	);

	test(
		'The measurement tables list every measurement reported for the result',
		{ tag: ['@needs-measurements'] },
		async ({ page, request }) => {
			const measurementsPage = new MeasurementsPage(page);
			const result = requireCapability(
				await firstMeasurementResultNode(request, requireManifest()),
				'Fixture manifest contains no result with measurements.'
			);
			let tables: { tool: string; name: string }[] = [];

			await given(
				'the API reports measurement tables for that result',
				async () => {
					const response = await request.get(
						`/api/v2/results/${result.node.id}/measurements`
					);
					expect(response.ok()).toBeTruthy();

					const payload = (await response.json()) as {
						tables?: { tool: string; name: string }[];
					};
					tables = requireCapability(
						payload.tables?.length ? payload.tables : null,
						`Result ${result.node.id} reports no measurement tables.`
					);
				}
			);
			await when(
				'I open the measurements page in the tables mode',
				async () => {
					await measurementsPage.goto(
						result.runCase.runId,
						result.node.id,
						'mode=tables'
					);
					await measurementsPage.expectLoaded('tables');
				}
			);
			await then(
				'every reported measurement is listed with its tool and name',
				async () => {
					for (const table of tables) {
						const row = page
							.getByRole('row')
							.filter({ hasText: table.tool })
							.filter({ hasText: table.name });

						await expect(row.first()).toBeVisible({ timeout: 30_000 });
					}
				}
			);
		}
	);

	async function selectTwoCharts(
		page: Page,
		request: APIRequestContext
	): Promise<{ runId: number; resultId: string | number; chartIds: string[] }> {
		const measurementsPage = new MeasurementsPage(page);
		const result = requireCapability(
			await firstMeasurementResultNode(request, requireManifest()),
			'Fixture manifest contains no result with measurements.'
		);

		await measurementsPage.goto(
			result.runCase.runId,
			result.node.id,
			'mode=charts'
		);
		await measurementsPage.expectLoaded('charts');

		await expect
			.poll(() => measurementsPage.chartSelectButtons().count(), {
				timeout: 30_000,
				message: 'charts rendered for the measurement result'
			})
			.toBeGreaterThan(1);

		const chartIds = [
			await measurementsPage.selectChart(0),
			await measurementsPage.selectChart(1)
		];

		return {
			runId: result.runCase.runId,
			resultId: result.node.id,
			chartIds
		};
	}

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A measurements link restores the layout and the selected charts',
		{ tag: ['@measurements', '@url-params', '@needs-measurements'] },
		async ({ page, request }) => {
			const measurementsPage = new MeasurementsPage(page);
			let link: {
				runId: number;
				resultId: string | number;
				chartIds: string[];
			};

			await given(
				'a link that pins the overlay layout and two selected charts',
				async () => {
					link = await selectTwoCharts(page, request);
				}
			);
			await when('I open that link', async () => {
				await measurementsPage.gotoWithParams(link.runId, link.resultId, {
					mode: 'overlay',
					selectedCharts: link.chartIds
				});
				await measurementsPage.expectLoaded('overlay');
			});
			await then('the page reports the overlay layout', () =>
				measurementsPage.expectParams({ mode: 'overlay' })
			);
			await and('the link still carries both chart ids as repeated keys', () =>
				measurementsPage.expectSelectedCharts(link.chartIds)
			);
		}
	);

	test(
		'Selecting charts records one repeated key per chart and survives a reload',
		{ tag: ['@measurements', '@url-params', '@needs-measurements'] },
		async ({ page, request }) => {
			const measurementsPage = new MeasurementsPage(page);
			let chartIds: string[] = [];

			await given(
				'I open the measurements page in the charts layout',
				async () => {
					const selection = await selectTwoCharts(page, request);
					chartIds = selection.chartIds;
				}
			);
			await when('I select two charts', () =>
				expect(new Set(chartIds).size).toBe(2)
			);
			await then(
				'each chart id is written as its own repeated key in the URL',
				() => measurementsPage.expectSelectedCharts(chartIds)
			);
			await when('I reload the page', async () => {
				await page.reload();
				await measurementsPage.expectLoaded('charts');
			});
			await then('both chart ids are still recorded in the URL', () =>
				measurementsPage.expectSelectedCharts(chartIds)
			);
		}
	);
});
