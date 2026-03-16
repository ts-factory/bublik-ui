/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Page } from '@playwright/test';

class MeasurementsPage {
	constructor(private readonly page: Page) {}

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

export { MeasurementsPage };
