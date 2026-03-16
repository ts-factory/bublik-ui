/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

class RunsPage {
	constructor(private readonly page: Page) {}

	async goto(): Promise<void> {
		await this.page.goto('runs');
		await expect(this.page).toHaveURL(/\/runs(?:$|\?)/);
	}

	// Navigate with a one-day range so the table shows the runs imported on
	// that date. startDate/finishDate accept the API day format (yyyy-MM-dd),
	// which is what the fixture manifest stores in `dashboardDate`.
	async gotoForDate(date: string): Promise<void> {
		const params = new URLSearchParams({
			startDate: date,
			finishDate: date,
			calendarMode: 'default',
			mode: 'table'
		});
		await this.page.goto(`runs?${params.toString()}`);
		await expect(this.page).toHaveURL(/\/runs\?/);
	}

	async gotoWithTagExpr(tagExpr: string): Promise<void> {
		const params = new URLSearchParams({ tagExpr, mode: 'table' });
		await this.page.goto(`runs?${params.toString()}`);
		await expect(this.page).toHaveURL(/\/runs\?/);
	}

	get table(): Locator {
		return this.page.getByTestId('runs-table');
	}

	async expectTableLoaded(): Promise<void> {
		const emptyState = this.page.getByRole('heading', {
			name: 'No runs found'
		});

		await expect(this.table.or(emptyState)).toBeVisible({ timeout: 30_000 });

		if (await emptyState.isVisible()) {
			throw new Error(
				'Expected runs table, but the current date/filter returned no runs. Check fixture import and query params.'
			);
		}

		await expect(this.page.getByTestId('runs-row').first()).toBeVisible({
			timeout: 30_000
		});
	}

	async expectReady(): Promise<void> {
		await expect(this.tagExprInput).toBeVisible({ timeout: 30_000 });
		await expect(
			this.page.getByRole('button', { name: 'Submit' })
		).toBeVisible();
	}

	row(runId: number): Locator {
		return this.page.locator(
			`[data-testid="runs-row"][data-run-id="${runId}"]`
		);
	}

	async expectRowVisible(runId: number): Promise<void> {
		await expect(this.row(runId)).toBeVisible({ timeout: 30_000 });
	}

	async firstRowRunId(): Promise<string | null> {
		return this.page
			.getByTestId('runs-row')
			.first()
			.getAttribute('data-run-id');
	}

	async openRun(runId: number): Promise<void> {
		await this.row(runId).getByTestId('run-details-link').click();
		await expect(this.page).toHaveURL(new RegExp(`/runs/${runId}`), {
			timeout: 15_000
		});
	}

	async openLog(runId: number): Promise<void> {
		await this.row(runId).getByTestId('run-log-link').click();
		await expect(this.page).toHaveURL(new RegExp(`/log/${runId}`), {
			timeout: 15_000
		});
	}

	async sortBySummary(): Promise<void> {
		await this.table.getByText('Statistic Summary', { exact: true }).click();
	}

	// Form controls. Submit/Reset are reachable by their accessible name; the
	// tag-expression field by its placeholder.
	get tagExprInput(): Locator {
		return this.page.getByPlaceholder('Tag expression');
	}

	async fillTagExpr(expr: string): Promise<void> {
		await this.tagExprInput.fill(expr);
	}

	async submit(): Promise<void> {
		await this.page.getByRole('button', { name: 'Submit' }).click();
	}

	async resetForm(): Promise<void> {
		await this.page.getByRole('button', { name: 'Reset form' }).click();
	}
}

export { RunsPage };
