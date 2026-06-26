/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Page } from '@playwright/test';

class RunMultiplePage {
	constructor(private readonly page: Page) {}

	async goto(runIds: number[], selectedRunId?: number): Promise<void> {
		const params = new URLSearchParams();
		for (const runId of runIds) params.append('runIds', String(runId));
		if (selectedRunId) params.set('selected', String(selectedRunId));

		await this.page.goto(`multiple${params.toString() ? `?${params}` : ''}`);
		await expect(this.page).toHaveURL(/\/multiple(?:$|\?)/);
	}

	async expectLoaded(): Promise<void> {
		await expect(this.page.getByTestId('run-multiple-page')).toBeVisible({
			timeout: 30_000
		});
	}

	async expectMissingRunsEmptyState(): Promise<void> {
		await expect(this.page.getByText('Run IDs are missing')).toBeVisible({
			timeout: 15_000
		});
	}

	async selectRun(runId: number): Promise<void> {
		await this.page
			.getByRole('link', { name: `Run ${runId}`, exact: true })
			.click();
		await expect(this.page).toHaveURL(new RegExp(`selected=${runId}`), {
			timeout: 15_000
		});
	}

	async openSelectedLog(): Promise<void> {
		const multiplePage = this.page.getByTestId('run-multiple-page');

		await multiplePage.getByRole('link', { name: 'Log', exact: true }).click();
		await expect(this.page).toHaveURL(/\/log\/\d+(?:\?|$)/, {
			timeout: 15_000
		});
	}
}

export { RunMultiplePage };
