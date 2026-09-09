/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { UrlParams, urlParams } from '../support/url-params';

const MEASUREMENTS_URL_PARAMS = {
	mode: {
		codec: 'useSearchState (plain for scalars)',
		values: 'default | charts | tables | split | overlay',
		whenAbsent: 'the default layout',
		writtenBy: 'the mode picker and the Open button of the chart selection'
	},
	selectedCharts: {
		codec: 'NumericArrayParam — the key is repeated once per value',
		values: 'chart ids',
		whenAbsent: 'nothing is selected',
		writtenBy: 'the Add to combined chart button on each chart'
	}
} as const;

type MeasurementsUrlParam = keyof typeof MEASUREMENTS_URL_PARAMS;

class MeasurementsPage {
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.url = urlParams(page);
	}

	async goto(
		runId: number,
		resultId: string | number,
		searchParams?: URLSearchParams | string
	): Promise<void> {
		const search =
			typeof searchParams === 'string'
				? searchParams
				: searchParams?.toString() ?? '';
		await this.page.goto(
			`runs/${runId}/results/${resultId}/measurements${
				search ? `?${search}` : ''
			}`
		);
		await expect(this.page).toHaveURL(
			new RegExp(`/runs/${runId}/results/${resultId}/measurements`)
		);
	}

	async expectLoaded(mode?: string): Promise<void> {
		const measurementsPage = this.page.getByTestId('measurements-page');

		await expect(measurementsPage).toBeVisible({ timeout: 30_000 });

		if (mode) {
			await expect(measurementsPage).toHaveAttribute(
				'data-measurements-mode',
				mode
			);
		}

		await expect(measurementsPage.getByText('Test result')).toBeVisible();
		await expect(
			measurementsPage.getByRole('link', { name: 'Run' })
		).toBeVisible();
		await expect(
			measurementsPage.getByRole('link', { name: 'Log' })
		).toBeVisible();
	}

	async gotoWithParams(
		runId: number,
		resultId: string | number,
		params: Record<string, string | string[]>
	): Promise<void> {
		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			for (const item of Array.isArray(value) ? value : [value]) {
				searchParams.append(key, item);
			}
		}

		await this.goto(runId, resultId, searchParams);
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectSelectedCharts(chartIds: readonly string[]): Promise<void> {
		await this.url.expectRepeated('selectedCharts', chartIds);
	}

	selectedChartsInUrl(): string[] {
		return this.url.getAll('selectedCharts');
	}

	chartSelectButtons(): Locator {
		return this.page
			.getByTestId('measurements-page')
			.getByRole('button', { name: 'Add to combined chart' });
	}

	async selectChart(index: number): Promise<string> {
		const before = new Set(this.selectedChartsInUrl());

		await this.chartSelectButtons().nth(index).click();
		await expect
			.poll(() => this.selectedChartsInUrl().length, {
				timeout: 15_000,
				message: 'selectedCharts should grow when a chart is added'
			})
			.toBeGreaterThan(before.size);

		const added = this.selectedChartsInUrl().find((id) => !before.has(id));

		return added ?? '';
	}

	async openOverlayFromSelection(): Promise<void> {
		await this.page
			.locator('#page-container')
			.getByRole('button', { name: 'Open', exact: true })
			.click();
		await expect(this.page).toHaveURL(/mode=overlay/, { timeout: 15_000 });
	}

	async openRun(): Promise<void> {
		await this.page
			.getByTestId('measurements-page')
			.getByRole('link', { name: /^Run$/ })
			.click();
		await expect(this.page).toHaveURL(/\/runs\/\d+/, { timeout: 15_000 });
	}

	async openLog(): Promise<void> {
		await this.page
			.getByTestId('measurements-page')
			.getByRole('link', { name: /^Log$/ })
			.click();
		await expect(this.page).toHaveURL(/\/log\/\d+\?/, { timeout: 15_000 });
	}
}

export { MEASUREMENTS_URL_PARAMS, MeasurementsPage };
export type { MeasurementsUrlParam };
