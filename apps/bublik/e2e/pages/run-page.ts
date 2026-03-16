/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Page } from '@playwright/test';

class RunPage {
	constructor(private readonly page: Page) {}

	async goto(runId: number): Promise<void> {
		await this.page.goto(`runs/${runId}`);
		await expect(this.page).toHaveURL(new RegExp(`/runs/${runId}`));
	}

	async expectLoaded(name: string): Promise<void> {
		await expect(this.page.getByTestId('run-table')).toBeVisible({
			timeout: 30_000
		});
		await expect(
			this.page.getByText(name, { exact: false }).first()
		).toBeVisible({ timeout: 30_000 });
	}

	async previewNok(): Promise<void> {
		await this.page.getByRole('button', { name: 'Preview NOK' }).click();
	}
}

export { RunPage };
