/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

/** Sidebar view modes of the runs page: the table, the charts, the matrix. */
type RunsMode = 'table' | 'charts' | 'progress';

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

	async gotoWithMode(mode: RunsMode): Promise<void> {
		await this.page.goto(`runs?mode=${mode}`);
		await expect(this.page).toHaveURL(new RegExp(`mode=${mode}`));
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
		// Wait for the controlled input to commit the value before submitting.
		// Without this, webkit can fire Submit before React registers the change
		// and the form posts an empty tag expression.
		await expect(this.tagExprInput).toHaveValue(expr);
	}

	async submit(): Promise<void> {
		await this.page.getByRole('button', { name: 'Submit' }).click();
	}

	async resetForm(): Promise<void> {
		await this.page.getByRole('button', { name: 'Reset form' }).click();
	}

	async expectEmptyState(): Promise<void> {
		await expect(
			this.page.getByRole('heading', { name: 'No runs found' })
		).toBeVisible({ timeout: 30_000 });
	}

	/** Total / OK / NOK badge of a row; `summary` is the lower-cased label. */
	summaryBadge(runId: number, summary: 'total' | 'ok' | 'nok'): Locator {
		return this.row(runId).locator(
			`[data-testid="run-summary-badge"][data-summary="${summary}"]`
		);
	}

	async expectNokCount(runId: number, count: number): Promise<void> {
		await expect(this.summaryBadge(runId, 'nok')).toContainText(String(count), {
			timeout: 30_000
		});
	}

	/**
	 * Like the dashboard NOK cell, this badge preventDefault()s and navigates with
	 * react-router state so the run table opens on the unexpected results; ctrl
	 * additionally expands their result tables.
	 */
	async openNok(
		runId: number,
		options: { ctrl?: boolean } = {}
	): Promise<void> {
		const badge = this.summaryBadge(runId, 'nok');
		await expect(badge).toBeVisible({ timeout: 30_000 });
		await badge.click(options.ctrl ? { modifiers: ['Control'] } : undefined);
		await expect(this.page).toHaveURL(new RegExp(`/runs/${runId}(?:$|[?#/])`), {
			timeout: 15_000
		});
	}

	/**
	 * Selection is toggled by clicking the row background: the handler ignores
	 * clicks whose target is not a TD or DIV, so links and badges navigate
	 * instead. Aim at a cell's padding to land on the TD itself.
	 */
	async selectRow(runId: number): Promise<void> {
		await this.row(runId)
			.locator('td')
			.first()
			.click({ position: { x: 2, y: 2 } });
	}

	get selectionTrigger(): Locator {
		return this.page.getByRole('button', { name: /\d+ runs selected/ });
	}

	async expectSelectedCount(count: number): Promise<void> {
		await expect(this.selectionTrigger).toHaveText(
			new RegExp(`${count} runs selected`),
			{ timeout: 15_000 }
		);
	}

	// The sidebar carries its own Multiple/Compare entries pointing at the same
	// selection, so the popover's links have to be scoped to the page body.
	multipleLink(): Locator {
		return this.page
			.locator('#page-container')
			.getByRole('link', { name: 'Multiple' });
	}

	compareLink(): Locator {
		return this.page
			.locator('#page-container')
			.getByRole('link', { name: 'Compare' });
	}

	async expectMultipleOffered(runIds: number[]): Promise<void> {
		const href = await this.multipleLink().getAttribute('href');
		for (const runId of runIds) {
			expect(href).toContain(`runIds=${runId}`);
		}
	}

	async expectCompareOffered(runIds: [number, number]): Promise<void> {
		const href = await this.compareLink().getAttribute('href');
		expect(href).toContain(`left=${runIds[0]}`);
		expect(href).toContain(`right=${runIds[1]}`);
	}
}

export { RunsPage };
export type { RunsMode };
