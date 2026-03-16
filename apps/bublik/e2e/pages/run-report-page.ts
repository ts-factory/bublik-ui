/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Page } from '@playwright/test';

class RunReportPage {
	constructor(private readonly page: Page) {}

	async goto(runId: number, configId?: number): Promise<void> {
		await this.page.goto(
			`runs/${runId}/report${configId ? `?config=${configId}` : ''}`
		);
		await expect(this.page).toHaveURL(new RegExp(`/runs/${runId}/report`));
	}

	async expectLoaded(): Promise<void> {
		await expect(this.page.getByTestId('run-report-page')).toBeVisible({
			timeout: 30_000
		});
	}

	async expectMissingConfig(): Promise<void> {
		await expect(this.page.getByText('Config ID is missing')).toBeVisible({
			timeout: 15_000
		});
	}

	async openConfigEditor(): Promise<void> {
		await this.page
			.getByRole('link', { name: /config/i })
			.first()
			.click();
		await expect(this.page).toHaveURL(/\/admin\/config\?configId=/, {
			timeout: 15_000
		});
	}
}

export { RunReportPage };
