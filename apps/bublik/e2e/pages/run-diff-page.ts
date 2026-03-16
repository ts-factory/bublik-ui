/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Page } from '@playwright/test';

class RunDiffPage {
	constructor(private readonly page: Page) {}

	async goto(leftRunId?: number, rightRunId?: number): Promise<void> {
		const params = new URLSearchParams();
		if (leftRunId) params.set('left', String(leftRunId));
		if (rightRunId) params.set('right', String(rightRunId));

		await this.page.goto(`compare${params.toString() ? `?${params}` : ''}`);
		await expect(this.page).toHaveURL(/\/compare(?:$|\?)/);
	}

	async expectLoaded(): Promise<void> {
		await expect(this.page.getByTestId('run-diff-page')).toBeVisible({
			timeout: 30_000
		});
	}

	async expectMissingRunsError(): Promise<void> {
		await expect(this.page.getByText('No selected runs')).toBeVisible({
			timeout: 15_000
		});
	}

	async showInfoDiff(): Promise<void> {
		await this.page.getByRole('button', { name: 'Info Diff' }).click();
	}

	async openLeftLog(): Promise<void> {
		await this.page
			.getByTestId('run-diff-page')
			.getByRole('banner')
			.locator('a[href*="/log/"]')
			.first()
			.click();
		await expect(this.page).toHaveURL(/\/log\/\d+(?:\?.*)?$/, {
			timeout: 15_000
		});
	}
}

export { RunDiffPage };
