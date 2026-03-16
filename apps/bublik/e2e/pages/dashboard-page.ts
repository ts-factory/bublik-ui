/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

class DashboardPage {
	constructor(private readonly page: Page) {}

	async goto(date?: string): Promise<void> {
		await this.page.goto(date ? `dashboard?main=${date}` : 'dashboard');
		await expect(this.page).toHaveURL(/\/dashboard(?:$|\?)/);
	}

	runLink(runName: string): Locator {
		return this.page.getByRole('link', { name: runName, exact: false }).first();
	}

	async expectRunVisible(runName: string): Promise<void> {
		await expect(this.runLink(runName)).toBeVisible({ timeout: 30_000 });
	}

	async expectRunIdVisible(runId: number): Promise<void> {
		await expect(
			this.page.locator(`[data-testid="dashboard-row"][data-run-id="${runId}"]`)
		).toBeVisible({ timeout: 30_000 });
	}

	async expectRunIdHidden(runId: number): Promise<void> {
		await expect(
			this.page.locator(`[data-testid="dashboard-row"][data-run-id="${runId}"]`)
		).toHaveCount(0);
	}

	async openRun(runName: string): Promise<number> {
		const link = this.runLink(runName);
		await expect(link).toBeVisible({ timeout: 30_000 });
		const href = await link.getAttribute('href');
		const runId = Number(href?.match(/\/runs\/(\d+)/)?.[1] ?? 0);

		await link.click();
		await expect(this.page).toHaveURL(/\/runs\/\d+/, { timeout: 15_000 });
		return runId;
	}
}

export { DashboardPage };
