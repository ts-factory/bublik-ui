/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

/**
 * `rows` is a single day in one column, `rows-line` a single day in two, and
 * `columns` two days side by side. The deployment default comes from
 * per_conf.json (`DASHBOARD_DEFAULT_MODE`), so tests that care about the layout
 * pass the mode explicitly instead of relying on it.
 */
type DashboardMode = 'rows' | 'rows-line' | 'columns';

interface DashboardNavigationOptions {
	mode?: DashboardMode;
}

const MODE_LABELS: Record<DashboardMode, string> = {
	rows: 'Mode rows',
	'rows-line': 'Mode rows line',
	columns: 'Mode columns'
};

class DashboardPage {
	constructor(private readonly page: Page) {}

	async goto(
		date?: string,
		options: DashboardNavigationOptions = {}
	): Promise<void> {
		const searchParams = new URLSearchParams();

		if (date) searchParams.set('main', date);
		if (options.mode) searchParams.set('mode', options.mode);

		const search = searchParams.size ? `?${searchParams.toString()}` : '';
		await this.page.goto(`dashboard${search}`);
		await expect(this.page).toHaveURL(/\/dashboard(?:$|\?)/);
	}

	row(runId: number): Locator {
		return this.page.locator(
			`[data-testid="dashboard-row"][data-run-id="${runId}"]`
		);
	}

	runLink(runName: string): Locator {
		return this.page.getByRole('link', { name: runName, exact: false }).first();
	}

	/**
	 * A counter cell of a run's row. `cellKey` is the dashboard column id from
	 * per_conf.json's DASHBOARD_HEADER (`total`, `unexpected`, `progress`, ...),
	 * which is stable even when the deployment renames the visible label.
	 */
	cell(runId: number, cellKey: string): Locator {
		return this.row(runId).locator(
			`[data-testid="dashboard-cell-link"][data-cell-key="${cellKey}"]`
		);
	}

	nokCell(runId: number): Locator {
		return this.cell(runId, 'unexpected');
	}

	expandButton(runId: number): Locator {
		return this.page.locator(
			`[data-testid="dashboard-row-expand"][data-run-id="${runId}"]`
		);
	}

	subrow(runId: number): Locator {
		return this.page.locator(
			`[data-testid="dashboard-row-subrow"][data-run-id="${runId}"]`
		);
	}

	async expectRunVisible(runName: string): Promise<void> {
		await expect(this.runLink(runName)).toBeVisible({ timeout: 30_000 });
	}

	async expectRunIdVisible(runId: number): Promise<void> {
		await expect(this.row(runId)).toBeVisible({ timeout: 30_000 });
	}

	async expectRunIdHidden(runId: number): Promise<void> {
		await expect(this.row(runId)).toHaveCount(0);
	}

	async expectEmpty(): Promise<void> {
		await expect(
			this.page.getByRole('heading', { name: 'No data', exact: true })
		).toBeVisible({ timeout: 30_000 });
	}

	async expectCellValue(
		runId: number,
		cellKey: string,
		value: string
	): Promise<void> {
		await expect(this.cell(runId, cellKey)).toHaveText(value, {
			timeout: 30_000
		});
	}

	async expectCellVisible(runId: number, cellKey: string): Promise<void> {
		await expect(this.cell(runId, cellKey)).toBeVisible({ timeout: 30_000 });
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

	/**
	 * The NOK cell does not navigate through its href: it preventDefault()s and
	 * navigates programmatically so it can carry react-router location state
	 * (`openUnexpected`, or `openUnexpectedResults` when ctrl is held), which the
	 * run table turns into "Preview NOK" / "Open NOK". That state cannot be
	 * deep-linked, so the flows have to be driven by a real click.
	 */
	async openCell(
		runId: number,
		cellKey: string,
		destination: RegExp
	): Promise<void> {
		const cell = this.cell(runId, cellKey);
		await expect(cell).toBeVisible({ timeout: 30_000 });
		await cell.click();
		await expect(this.page).toHaveURL(destination, { timeout: 15_000 });
	}

	async openUnexpected(runId: number): Promise<void> {
		await this.openCell(
			runId,
			'unexpected',
			new RegExp(`/runs/${runId}(?:$|[?#/])`)
		);
	}

	async openUnexpectedResults(runId: number): Promise<void> {
		const cell = this.nokCell(runId);
		await expect(cell).toBeVisible({ timeout: 30_000 });
		await cell.click({ modifiers: ['Control'] });
		await expect(this.page).toHaveURL(new RegExp(`/runs/${runId}(?:$|[?#/])`), {
			timeout: 15_000
		});
	}

	async expandRow(runId: number): Promise<void> {
		await this.expandButton(runId).click();
		await expect(this.expandButton(runId)).toHaveAttribute(
			'aria-expanded',
			'true'
		);
	}

	async collapseRow(runId: number): Promise<void> {
		await this.expandButton(runId).click();
		await expect(this.expandButton(runId)).toHaveAttribute(
			'aria-expanded',
			'false'
		);
	}

	async expectSubrowVisible(runId: number): Promise<void> {
		await expect(this.subrow(runId)).toBeVisible({ timeout: 30_000 });
	}

	async expectSubrowHidden(runId: number): Promise<void> {
		await expect(this.subrow(runId)).toHaveCount(0);
	}

	async search(term: string): Promise<void> {
		// The search bar debounces by 400ms before it writes ?search=.
		await this.page.getByPlaceholder('Search...').fill(term);
	}

	async clearSearch(): Promise<void> {
		await this.search('');
	}

	async setMode(mode: DashboardMode): Promise<void> {
		await this.page.getByLabel(MODE_LABELS[mode]).click();
		await expect(this.page).toHaveURL(new RegExp(`mode=${mode}`), {
			timeout: 15_000
		});
	}

	async clickToday(): Promise<void> {
		await this.page.getByRole('button', { name: 'Today' }).click();
	}

	async expectDateNotPinned(): Promise<void> {
		await expect
			.poll(() => new URL(this.page.url()).searchParams.get('main'), {
				timeout: 15_000
			})
			.toBeNull();
	}
}

export { DashboardPage };
export type { DashboardMode };
