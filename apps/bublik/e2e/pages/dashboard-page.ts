/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { expectConclusionHoverCard } from '../support/conclusion-hover';
import { UrlParams, urlParams } from '../support/url-params';

type DashboardMode = 'rows' | 'rows-line' | 'columns';

interface DashboardNavigationOptions {
	mode?: DashboardMode;
	projectId?: number;
}

const MODE_LABELS: Record<DashboardMode, string> = {
	rows: 'Mode rows',
	'rows-line': 'Mode rows line',
	columns: 'Mode columns'
};

const DASHBOARD_URL_PARAMS = {
	main: {
		codec: 'DateParam',
		values: 'YYYY-MM-DD',
		whenAbsent: 'the day the backend reports as the latest',
		writtenBy: 'the main date picker; cleared by Today'
	},
	secondary: {
		codec: 'DateParam',
		values: 'YYYY-MM-DD',
		whenAbsent: 'in columns mode, the latest day minus one',
		writtenBy: 'the secondary date picker and the mode picker'
	},
	mode: {
		codec: 'StringParam',
		values: 'rows | rows-line | columns',
		whenAbsent: 'the deployment default from /dashboard/default_mode',
		writtenBy: 'the mode picker'
	},
	search: {
		codec: 'StringParam',
		values: 'free text',
		whenAbsent: 'no filter is applied',
		writtenBy: 'the search bar, 400ms after typing stops'
	},
	reload: {
		codec: 'BooleanParam',
		values: '1 | 0',
		whenAbsent: 'auto reload is off',
		writtenBy: 'the Auto reload switch and entering/leaving TV mode'
	},
	tv: {
		codec: 'BooleanParam',
		values: '1 | 0',
		whenAbsent: 'TV mode is closed',
		writtenBy: 'the TV button and Escape'
	},
	project: {
		codec: 'raw, repeatable',
		values: 'project id',
		whenAbsent: 'every project is listed',
		writtenBy: 'the sidebar project picker'
	}
} as const;

type DashboardUrlParam = keyof typeof DASHBOARD_URL_PARAMS;

class DashboardPage {
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.url = urlParams(page);
	}

	async goto(
		date?: string,
		options: DashboardNavigationOptions = {}
	): Promise<void> {
		const params: Record<string, string> = {};

		if (date) params.main = date;
		if (options.mode) params.mode = options.mode;
		if (typeof options.projectId === 'number') {
			params.project = String(options.projectId);
		}

		await this.gotoWithParams(params);
	}

	async gotoWithParams(params: Record<string, string>): Promise<void> {
		const searchParams = new URLSearchParams(params);
		const search = searchParams.size ? `?${searchParams.toString()}` : '';

		await this.page.goto(`dashboard${search}`);
		await expect(this.page).toHaveURL(/\/dashboard(?:$|\?)/);
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsPresent(keys: readonly string[]): Promise<void> {
		await this.url.expectPresent(keys);
	}

	async expectParamsAbsent(keys: readonly string[]): Promise<void> {
		await this.url.expectAbsent(keys);
	}

	async expectProjectsPinned(projectIds: readonly number[]): Promise<void> {
		await this.url.expectRepeated('project', projectIds.map(String));
	}

	async expectParamsUnchangedWhile(
		keys: readonly string[],
		action: () => Promise<void>
	): Promise<void> {
		await this.url.expectUnchangedWhile(keys, action);
	}

	row(runId: number): Locator {
		return this.page.locator(
			`[data-testid="dashboard-row"][data-run-id="${runId}"]`
		);
	}

	runLink(runName: string): Locator {
		return this.page.getByRole('link', { name: runName, exact: false }).first();
	}

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

	async expectRowConclusion(runId: number, conclusion: string): Promise<void> {
		await expectConclusionHoverCard(
			this.page,
			this.row(runId).getByTestId('run-conclusion'),
			conclusion
		);
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

	searchInput(): Locator {
		return this.page.getByPlaceholder('Search...');
	}

	async search(term: string): Promise<void> {
		await this.searchInput().fill(term);
	}

	async clearSearch(): Promise<void> {
		await this.search('');
	}

	async expectSearchInput(term: string): Promise<void> {
		await expect(this.searchInput()).toHaveValue(term, { timeout: 15_000 });
	}

	modeButton(mode: DashboardMode): Locator {
		return this.page.getByLabel(MODE_LABELS[mode], { exact: true });
	}

	async setMode(mode: DashboardMode): Promise<void> {
		await this.modeButton(mode).click();
		await expect(this.page).toHaveURL(new RegExp(`mode=${mode}`), {
			timeout: 15_000
		});
	}

	async expectModeActive(mode: DashboardMode): Promise<void> {
		await expect(this.modeButton(mode)).toHaveAttribute(
			'aria-checked',
			'true',
			{ timeout: 15_000 }
		);
	}

	async expectRunIdsVisible(runIds: number[]): Promise<void> {
		for (const runId of runIds) await this.expectRunIdVisible(runId);
	}

	async expectRunIdsHidden(runIds: number[]): Promise<void> {
		for (const runId of runIds) await this.expectRunIdHidden(runId);
	}

	async waitForDayFetch(
		action: () => Promise<unknown> | unknown,
		options: { timeout?: number; notBefore?: number } = {}
	): Promise<void> {
		const { timeout = 15_000, notBefore = 0 } = options;
		const startedAt = Date.now();

		await Promise.all([
			this.page.waitForResponse(
				(response) => {
					const url = response.url();
					return (
						response.request().method() === 'GET' &&
						/\/api\/v2\/dashboard\/\?/.test(url) &&
						url.includes('date=') &&
						response.status() === 200 &&
						Date.now() - startedAt >= notBefore
					);
				},
				{ timeout }
			),
			action()
		]);
	}

	refreshButton(): Locator {
		return this.page.getByRole('button', { name: 'Refresh dashboard' });
	}

	async clickRefresh(): Promise<void> {
		await this.refreshButton().click();
	}

	autoReloadToggle(): Locator {
		return this.page.getByRole('switch', { name: 'Auto reload' });
	}

	async setAutoReload(enabled: boolean): Promise<void> {
		const toggle = this.autoReloadToggle();
		await expect(toggle).toHaveAttribute(
			'aria-checked',
			enabled ? 'false' : 'true'
		);
		await toggle.click();
		await this.expectAutoReload(enabled);
	}

	async expectAutoReload(enabled: boolean): Promise<void> {
		await expect(this.autoReloadToggle()).toHaveAttribute(
			'aria-checked',
			String(enabled)
		);
		await expect(this.page).toHaveURL(new RegExp(`reload=${enabled ? 1 : 0}`), {
			timeout: 15_000
		});
	}

	tvScreen(): Locator {
		return this.page.getByRole('dialog');
	}

	tvRow(runId: number): Locator {
		return this.tvScreen().locator(
			`[data-testid="dashboard-row"][data-run-id="${runId}"]`
		);
	}

	async enterTvMode(): Promise<void> {
		await this.page.getByRole('button', { name: 'TV' }).click();
	}

	async leaveTvMode(): Promise<void> {
		await this.page.keyboard.press('Escape');
	}

	async expectTvRunVisible(runId: number): Promise<void> {
		await expect(this.tvRow(runId)).toBeVisible({ timeout: 30_000 });
	}

	async expectTvScreenVisible(): Promise<void> {
		await expect(this.tvScreen()).toBeVisible({ timeout: 15_000 });
	}

	async expectTvModeOpen(): Promise<void> {
		await expect(this.tvScreen()).toBeVisible({ timeout: 15_000 });
		await expect(this.page).toHaveURL(/tv=1/, { timeout: 15_000 });
		await expect(this.page).toHaveURL(/reload=1/, { timeout: 15_000 });
		await expect(
			this.tvScreen().getByRole('button', { name: 'Today' })
		).toHaveCount(0);
	}

	async expectTvModeClosed(): Promise<void> {
		await expect(this.tvScreen()).toHaveCount(0);
		await expect(this.page).toHaveURL(/tv=0/, { timeout: 15_000 });
		await expect(this.page).toHaveURL(/reload=0/, { timeout: 15_000 });
		await expect(this.todayButton()).toBeVisible();
	}

	todayButton(): Locator {
		return this.page.getByRole('button', { name: 'Today' });
	}

	async clickToday(): Promise<void> {
		await this.todayButton().click();
	}

	async expectDateNotPinned(): Promise<void> {
		await expect
			.poll(() => new URL(this.page.url()).searchParams.get('main'), {
				timeout: 15_000
			})
			.toBeNull();
	}
}

export { DASHBOARD_URL_PARAMS, DashboardPage };
export type { DashboardMode, DashboardUrlParam };
