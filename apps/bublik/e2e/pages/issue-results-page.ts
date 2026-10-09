/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { confirm, expectToast } from '../support/classification';
import { exactText } from '../support/e2e-data';
import { UrlParams, urlParams } from '../support/url-params';

/**
 * The results table on an issue's results page is the run page's result
 * table, paged and narrowed by the server; it keeps its filters the way the
 * run page does, under one compressed parameter, beside the page it is on.
 */
const ISSUE_RESULTS_URL_PARAMS = {
	page: {
		codec: 'PageParam',
		values: '1-based page number',
		whenAbsent: 'the first page',
		writtenBy: 'the footer pagination; forced back to 1 by any filter change'
	},
	pageSize: {
		codec: 'raw, one of 10 | 25 | 50 | 75 | 100',
		values: 'results per page',
		whenAbsent: '25',
		writtenBy: 'the Rows select in the footer'
	},
	columnFilters: {
		codec:
			'lz-string compressed JSON, keyed by the table (`issue-<issueId>`), as the run page writes it',
		values:
			'the Obtained Result, Result Type, Verdicts, Category, Classification, Artifacts, Parameters and Requirements selections',
		whenAbsent: 'every result stamped under the issue',
		writtenBy: 'the toolbar filters, the chips of a row, and Reset'
	}
} as const;

type IssueResultsUrlParam = keyof typeof ISSUE_RESULTS_URL_PARAMS;

/** The result table's columns, by the id each cell carries. */
type ResultColumn =
	| 'links'
	| 'test'
	| 'obtained-result'
	| 'expected_results'
	| 'artifacts'
	| 'parameters'
	| 'requirements';

/**
 * `/issues/:issueId/results`: the run page's result table over every result
 * stamped under one issue, across runs.
 *
 * The table's cells are siblings in one grid, with no row box around them;
 * a result's cells share its `data-result-id`, and a column's cells share a
 * `data-column-id`. So a "row" here is the one Obtained Result cell of a
 * result, and the other cells of that result are reached by id.
 */
class IssueResultsPage {
	readonly root: Locator;
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId('issue-results-page');
		this.url = urlParams(page);
	}

	get heading(): Locator {
		return this.root.getByRole('heading', { level: 1 });
	}

	/** The facts block the issue page shows too: Key, Rules, Created, Updated. */
	get header(): Locator {
		return this.root.getByTestId('issue-detail-header');
	}

	/** The header bar's link to the issue's page, where its rules are. */
	get rulesLink(): Locator {
		return this.root.getByRole('link', { name: 'Rules', exact: true });
	}

	get deleteButton(): Locator {
		return this.root.getByTestId('issue-delete');
	}

	/** The scroller the rows live in, between the toolbar and the footer. */
	get table(): Locator {
		return this.root.getByTestId('issue-results-table');
	}

	get pagination(): Locator {
		return this.root.getByTestId('tw-pagination');
	}

	get rowsPerPage(): Locator {
		return this.pagination.getByRole('combobox', { name: 'Rows per page' });
	}

	/** "1–25 of 40 results", "No results" …: the footer's, not the empty state's heading. */
	get footerRange(): Locator {
		return this.root.getByTestId('classification-range');
	}

	get resetButton(): Locator {
		return this.root.getByRole('button', { name: 'Reset', exact: true });
	}

	/** Inside the scroller: the footer reads "No results" as well. */
	get emptyState(): Locator {
		return this.table.getByText('No results', { exact: true });
	}

	get noMatching(): Locator {
		return this.table.getByText('No matching results', { exact: true });
	}

	/** The sidebar's count of the issue's rules, on its Issue › Rules item. */
	get sidebarRuleCount(): Locator {
		return this.page.getByTestId('issue-sidebar-rule-count');
	}

	/** The sidebar's count of the issue's results, on its Issue › Results item. */
	get sidebarResultCount(): Locator {
		return this.page.getByTestId('issue-sidebar-result-count');
	}

	/** The faceted filter titled `title`; its name grows with the selection. */
	facet(title: string): Locator {
		return this.root
			.getByRole('button', { name: new RegExp(`^${title}(\\s|$)`) })
			.first();
	}

	/** An option of the open facet; the label is the whole of its text. */
	facetOption(label: string): Locator {
		return this.page
			.locator('[cmdk-item]')
			.filter({ hasText: exactText(label) });
	}

	cells(column: ResultColumn): Locator {
		return this.table.locator(`[data-column-id="${column}"]`);
	}

	/** One cell per result: the Obtained Result cells stand for the rows. */
	rows(): Locator {
		return this.cells('obtained-result');
	}

	cellOf(resultId: number, column: ResultColumn): Locator {
		return this.table.locator(
			`[data-column-id="${column}"][data-result-id="${resultId}"]`
		);
	}

	runLink(resultId: number): Locator {
		return this.cellOf(resultId, 'links').getByRole('link', {
			name: /^Run \d+$/
		});
	}

	resultLink(resultId: number, name: 'Log' | 'History'): Locator {
		return this.cellOf(resultId, 'links').getByRole('link', {
			name: new RegExp(`^${name}`)
		});
	}

	previewButton(resultId: number): Locator {
		return this.cellOf(resultId, 'links').getByRole('button', {
			name: 'Preview',
			exact: true
		});
	}

	async goto(
		issueId: number | string,
		params?: Record<string, string>
	): Promise<void> {
		const search = new URLSearchParams(params ?? {}).toString();

		await this.page.goto(
			`issues/${issueId}/results${search ? `?${search}` : ''}`
		);
		await expect(this.page).toHaveURL(
			new RegExp(`/issues/${issueId}/results(?:$|\\?)`)
		);
	}

	async expectLoaded(title: string): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await expect(this.heading).toHaveText(title, { timeout: 30_000 });
		await expect(this.page).toHaveTitle(
			new RegExp(`${escapeRegExp(title)} - Issue Results - Bublik$`),
			{ timeout: 15_000 }
		);
		await this.expectReady();
	}

	/**
	 * The rows, or the state that says there are none, are on screen and
	 * current: the table keeps the previous page up, dimmed, while the server
	 * answers a filter or page change, and the pager with it.
	 */
	async expectReady(): Promise<void> {
		await expect(
			this.rows().first().or(this.emptyState).or(this.noMatching)
		).toBeVisible({ timeout: 30_000 });
		await expect(this.table).toHaveAttribute('data-fetching', 'false', {
			timeout: 30_000
		});
	}

	async expectOpen(issueId: number): Promise<void> {
		await expect(this.page).toHaveURL(
			new RegExp(`/issues/${issueId}/results(?:$|\\?)`),
			{ timeout: 15_000 }
		);
		await expect(this.root).toBeVisible({ timeout: 30_000 });
	}

	/**
	 * Brings the page listing `resultId` on screen. An issue's rules stamp
	 * every run imported after them, so the results the seed stamped by hand
	 * can sit past the first page whatever the page size: the page on screen
	 * is tried first, then every page from the first.
	 */
	async locateResult(resultId: number): Promise<void> {
		if (await this.isListedOnPage(resultId, 10_000)) return;

		await this.openFirstPage();
		for (;;) {
			if (await this.isListedOnPage(resultId, 5_000)) return;
			if (!(await this.hasNextPage())) {
				throw new Error(
					`result ${resultId} is listed on no page of the issue's results`
				);
			}
			const ids = await this.resultIdsOnPage();
			await this.openNextPage();
			await this.resultIdsOnPageOtherThan(ids);
		}
	}

	/** Whether `resultId` is on the page on screen, once it has settled. */
	private async isListedOnPage(
		resultId: number,
		timeout: number
	): Promise<boolean> {
		await this.expectReady();

		return this.cellOf(resultId, 'obtained-result')
			.first()
			.waitFor({ state: 'attached', timeout })
			.then(
				() => true,
				() => false
			);
	}

	async expectResultListed(resultId: number): Promise<void> {
		await this.locateResult(resultId);
		await expect(this.cellOf(resultId, 'obtained-result')).toHaveCount(1, {
			timeout: 30_000
		});
	}

	/** `resultId` is on no page of the results. */
	async expectResultGone(resultId: number): Promise<void> {
		await this.openFirstPage();
		for (;;) {
			await this.expectReady();
			await expect(this.cellOf(resultId, 'obtained-result')).toHaveCount(0, {
				timeout: 30_000
			});
			if (!(await this.hasNextPage())) return;
			const ids = await this.resultIdsOnPage();
			await this.openNextPage();
			await this.resultIdsOnPageOtherThan(ids);
		}
	}

	/** The Test cell names the test, with the packages above it beneath. */
	async expectTest(
		resultId: number,
		{ name, packagePath }: { name: string; packagePath: string }
	): Promise<void> {
		await this.locateResult(resultId);
		const cell = this.cellOf(resultId, 'test');

		await expect(cell).toHaveCount(1, { timeout: 30_000 });
		await expect(cell.getByText(name, { exact: true })).toBeVisible({
			timeout: 15_000
		});
		await expect(cell.getByText(packagePath, { exact: true })).toBeVisible();
	}

	async expectVerdicts(
		resultId: number,
		verdicts: readonly string[]
	): Promise<void> {
		const cell = this.cellOf(resultId, 'obtained-result');

		for (const verdict of verdicts) {
			await expect(cell.getByText(verdict.trim()).first()).toBeVisible({
				timeout: 15_000
			});
		}
	}

	/** The Run link names the run the result belongs to and opens it. */
	async expectRunLink(resultId: number, runId: number): Promise<void> {
		const link = this.runLink(resultId);

		await expect(link).toHaveText(`Run ${runId}`, { timeout: 15_000 });
		await expect(link).toHaveAttribute('href', new RegExp(`/runs/${runId}`));
	}

	async expectResultLinks(resultId: number): Promise<void> {
		await expect(this.runLink(resultId)).toBeVisible({ timeout: 15_000 });
		await expect(this.resultLink(resultId, 'Log')).toBeVisible();
		await expect(this.resultLink(resultId, 'History')).toBeVisible();
		await expect(this.previewButton(resultId)).toBeVisible();
	}

	async expectRowCount(count: number): Promise<void> {
		await expect(this.rows()).toHaveCount(count, { timeout: 30_000 });
	}

	async expectRowCountAtMost(count: number): Promise<void> {
		await expect
			.poll(() => this.rows().count(), { timeout: 30_000 })
			.toBeLessThanOrEqual(count);
	}

	/** "of N" in the footer: how many results the filters leave, over every page. */
	async footerTotal(): Promise<number> {
		await expect(this.footerRange).toBeVisible({ timeout: 30_000 });
		const text = (await this.footerRange.innerText()).trim();

		return Number(/of (\d+)/.exec(text)?.[1] ?? 0);
	}

	/**
	 * The footer counts at least `count` results: another scenario may apply
	 * the issue's rules to a run and stamp more.
	 */
	async expectFooterTotalAtLeast(count: number): Promise<void> {
		await expect
			.poll(() => this.footerTotal(), {
				timeout: 30_000,
				message: 'results counted in the footer'
			})
			.toBeGreaterThanOrEqual(count);
	}

	/** The footer starts at `first` and ends at `last`, over however many. */
	async expectFooterRange(first: number, last: number): Promise<void> {
		await expect(this.footerRange).toHaveText(
			new RegExp(`^${first}–${last} of \\d+ `),
			{ timeout: 30_000 }
		);
	}

	async expectNoResultsInFooter(): Promise<void> {
		await expect(this.footerRange).toHaveText('No results', {
			timeout: 30_000
		});
	}

	async toggleFacet(title: string, label: string): Promise<void> {
		await this.facet(title).click();
		const option = this.facetOption(label).first();
		await expect(option).toBeVisible({ timeout: 15_000 });
		await option.click();
		await this.page.keyboard.press('Escape');
		await expect(option).toBeHidden({ timeout: 15_000 });
	}

	async expectFacetReports(title: string, label: string): Promise<void> {
		await expect(this.facet(title)).toContainText(label, { timeout: 15_000 });
	}

	async reset(): Promise<void> {
		await this.resetButton.click();
	}

	async setRowsPerPage(size: 10 | 25 | 50 | 75 | 100): Promise<void> {
		await this.rowsPerPage.click();
		await this.page
			.getByRole('option', { name: String(size), exact: true })
			.click();
	}

	async expectRowsPerPage(size: number): Promise<void> {
		await expect(this.rowsPerPage).toHaveText(String(size), {
			timeout: 15_000
		});
	}

	get nextPageButton(): Locator {
		return this.pagination.getByRole('button', { name: 'Next page' });
	}

	async hasNextPage(): Promise<boolean> {
		await this.expectReady();

		return (
			(await this.nextPageButton.count()) > 0 &&
			(await this.nextPageButton.isEnabled())
		);
	}

	async openNextPage(): Promise<void> {
		await this.nextPageButton.click();
	}

	get previousPageButton(): Locator {
		return this.pagination.getByRole('button', { name: 'Previous page' });
	}

	/**
	 * Back to the first page, one page at a time, as the pager offers. A
	 * single page has no pager buttons at all, and is the first page.
	 */
	async openFirstPage(): Promise<void> {
		for (;;) {
			await this.expectReady();
			if ((await this.previousPageButton.count()) === 0) return;
			if (!(await this.previousPageButton.isEnabled())) return;
			const ids = await this.resultIdsOnPage();
			await this.previousPageButton.click();
			await this.resultIdsOnPageOtherThan(ids);
		}
	}

	/** The ids of the results on this page, top to bottom. */
	async resultIdsOnPage(): Promise<number[]> {
		await expect(this.rows().first()).toHaveCount(1, { timeout: 30_000 });

		return this.rows().evaluateAll((cells) =>
			cells.map((cell) => Number(cell.getAttribute('data-result-id')))
		);
	}

	/** The ids on this page once it no longer shows the page `previous` came from. */
	async resultIdsOnPageOtherThan(
		previous: readonly number[]
	): Promise<number[]> {
		let ids: number[] = [];
		await expect(async () => {
			ids = await this.resultIdsOnPage();
			expect(ids).not.toEqual(previous);
		}).toPass({ timeout: 30_000 });

		return ids;
	}

	async openRules(): Promise<void> {
		await this.rulesLink.click();
		await expect(this.page).toHaveURL(/\/issues\/\d+(?:$|\?)/, {
			timeout: 15_000
		});
	}

	async deleteIssue(title: string): Promise<void> {
		await this.deleteButton.click();
		await confirm(this.page, `Delete ${title}?`, 'Delete');
		await expectToast(this.page, 'Issue deleted');
		await expect(this.page).toHaveURL(/\/issues(?:$|\?)/, { timeout: 15_000 });
	}

	async expectEmpty(): Promise<void> {
		await expect(this.emptyState).toBeVisible({ timeout: 30_000 });
		await expect(
			this.table.getByText(
				'Nothing is classified under this issue yet. Classify a failing result against it, or write a rule and apply it to a run.'
			)
		).toBeVisible();
	}

	async expectNoMatching(): Promise<void> {
		await expect(this.noMatching).toBeVisible({ timeout: 30_000 });
	}

	async expectNotFound(issueId: string): Promise<void> {
		await expect(this.page).toHaveURL(
			new RegExp(`/issues/${issueId}/results$`)
		);
		await expect(this.page.getByText(/not found/i).first()).toBeVisible({
			timeout: 15_000
		});
		await expect(this.page.locator('#sidebar')).toBeVisible();
	}

	async expectSidebarRuleCount(count: number): Promise<void> {
		await expect(this.sidebarRuleCount).toHaveText(String(count), {
			timeout: 30_000
		});
	}

	async expectSidebarResultCountAtLeast(count: number): Promise<void> {
		await expect
			.poll(
				async () => Number((await this.sidebarResultCount.innerText()).trim()),
				{ timeout: 30_000, message: 'results counted in the sidebar' }
			)
			.toBeGreaterThanOrEqual(count);
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsPresent(
		keys: readonly IssueResultsUrlParam[]
	): Promise<void> {
		await this.url.expectPresent(keys);
	}

	async expectParamsAbsent(
		keys: readonly IssueResultsUrlParam[]
	): Promise<void> {
		await this.url.expectAbsent(keys);
	}
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { ISSUE_RESULTS_URL_PARAMS, IssueResultsPage };
export type { IssueResultsUrlParam, ResultColumn };
