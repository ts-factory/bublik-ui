/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import {
	CATEGORY_BADGE,
	confirm,
	EFFECT_BADGE,
	EFFECT_DISPLAY,
	expectToast,
	toast
} from '../support/classification';
import type { IssueCategory, RunIssueEffect } from '../support/classification';
import { UrlParams, urlParams } from '../support/url-params';
import { ClassificationTable } from './classification-table';
import { IssueDrawer } from './issue-drawer';

const RUN_ISSUES_URL_PARAMS = {
	page: {
		codec: 'PageParam',
		values: '1-based page number',
		whenAbsent: 'the first page',
		writtenBy:
			'the footer pagination; forced back to 1 by any search or filter change'
	},
	pageSize: {
		codec: 'raw, one of 10 | 25 | 50 | 75 | 100',
		values: 'issues per page',
		whenAbsent: '25',
		writtenBy: 'the Rows select in the footer'
	},
	q: {
		codec: 'raw',
		values: 'search text, matched against title and key in the browser',
		whenAbsent: 'no search',
		writtenBy: 'the toolbar search'
	},
	sort: {
		codec: '<columnId>:asc | <columnId>:desc | none',
		values: 'result_count | issue',
		whenAbsent: 'result_count:desc',
		writtenBy: 'the Results and Issue column headers'
	},
	open: {
		codec: '`;`-joined issue ids',
		values: 'issues whose results are shown',
		whenAbsent: 'no results shown',
		writtenBy: 'the Results count badge of a row'
	},
	cols: {
		codec: '`;`-joined visibility overrides',
		values: '-<columnId> | +<columnId>',
		whenAbsent: 'every column',
		writtenBy:
			'the Columns menu; mirrored to localStorage `bublik.columns.run-issues`'
	},
	order: {
		codec: '`;`-joined column ids',
		values: 'the movable columns, left to right',
		whenAbsent: 'the default order',
		writtenBy: 'dragging a row of the Columns menu'
	},
	state: {
		codec: '`;`-joined',
		values: 'open | closed',
		whenAbsent: 'both states',
		writtenBy: 'the State filter and the State badge of a row'
	},
	effect: {
		codec: '`;`-joined',
		values: 'suppressed | stale | unexpected | marked',
		whenAbsent: 'every effect',
		writtenBy: 'the Effect On Run filter and the effect badge of a row'
	},
	categories: {
		codec: '`;`-joined',
		values: 'category slugs',
		whenAbsent: 'every category',
		writtenBy: 'the Category filter and the category badges of a row'
	}
} as const;

type RunIssuesUrlParam = keyof typeof RUN_ISSUES_URL_PARAMS;

class RunIssuesPage {
	readonly root: Locator;
	readonly table: ClassificationTable;
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId('run-issues-page');
		this.table = new ClassificationTable(page, this.root, {
			noun: 'issue',
			searchPlaceholder: 'Search title or key',
			resetTestId: 'run-issues-reset-filters',
			tableTestId: 'run-issues-table'
		});
		this.url = urlParams(page);
	}

	get runLink(): Locator {
		return this.root.getByRole('link', { name: 'Run', exact: true });
	}

	get logLink(): Locator {
		return this.root.getByRole('link', { name: 'Log', exact: true });
	}

	get applyRulesButton(): Locator {
		return this.root.getByTestId('apply-rules-button');
	}

	get emptyState(): Locator {
		return this.root.getByText(
			'Nothing in this run is classified yet. Classify a failing result, or apply the active rules to this run.'
		);
	}

	get resultsPanel(): Locator {
		return this.root.getByTestId('issue-results');
	}

	rows(): Locator {
		return this.root.locator('[data-testid="run-issue-row"]');
	}

	rowByTitle(title: string): Locator {
		return this.rows().filter({
			has: this.page.getByRole('link', { name: title, exact: true })
		});
	}

	rowById(issueId: number): Locator {
		return this.root.locator(
			`[data-testid="run-issue-row"][data-issue-id="${issueId}"]`
		);
	}

	effectBadge(row: Locator): Locator {
		return row.locator('[data-testid="tw-badge"][data-effect]');
	}

	resultCountButton(row: Locator): Locator {
		return row.getByTestId('run-issue-result-count');
	}

	resultRows(): Locator {
		return this.resultsPanel.locator('[data-testid="issue-result-row"]');
	}

	resultLink(resultRow: Locator, name: 'Run' | 'Log' | 'History'): Locator {
		return resultRow.getByRole('link', { name: new RegExp(`^${name}`) });
	}

	resultPreviewButton(resultRow: Locator): Locator {
		return resultRow.getByRole('button', { name: 'Preview', exact: true });
	}

	keyLink(row: Locator): Locator {
		return row.getByTestId('issue-key-link');
	}

	editButton(row: Locator): Locator {
		return row.getByTestId('issue-edit');
	}

	deleteButton(row: Locator): Locator {
		return row.getByTestId('issue-delete');
	}

	loginRequiredAction(message: string): Locator {
		return this.page.getByRole('button', { name: message, exact: true });
	}

	async goto(runId: number, params?: Record<string, string>): Promise<void> {
		const search = new URLSearchParams(params ?? {}).toString();

		await this.page.goto(`runs/${runId}/issues${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(new RegExp(`/runs/${runId}/issues`));
	}

	/** The table shows skeletons until the run details name a project. */
	async expectLoaded(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await expect(this.table.table.or(this.emptyState)).toBeVisible({
			timeout: 60_000
		});
	}

	async expandResults(row: Locator): Promise<void> {
		await this.resultCountButton(row).click();
		await expect(this.resultCountButton(row)).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		await expect(this.resultsPanel).toBeVisible({ timeout: 30_000 });
	}

	/** Applies the rules and resolves with the toast's wording. */
	async applyRules(): Promise<string> {
		await this.applyRulesButton.click();
		const applied = toast(this.page, /^Applied — /);
		await expect(applied).toBeVisible({ timeout: 60_000 });

		return (await applied.innerText()).trim();
	}

	async openIssue(row: Locator, title: string): Promise<void> {
		await row.getByRole('link', { name: title, exact: true }).click();
		await expect(this.page).toHaveURL(/\/issues\/\d+/, { timeout: 15_000 });
	}

	async openEdit(row: Locator): Promise<IssueDrawer> {
		await this.editButton(row).click();
		const drawer = new IssueDrawer(this.page);
		await drawer.expectOpen('Edit Issue');

		return drawer;
	}

	async deleteIssue(row: Locator, title: string): Promise<void> {
		await this.deleteButton(row).click();
		await confirm(this.page, `Delete ${title}?`, 'Delete');
		await expectToast(this.page, 'Issue deleted');
	}

	async expectIssueListed(title: string): Promise<void> {
		await this.table.expectRowListed(this.rowByTitle(title));
	}

	async expectIssueGone(title: string): Promise<void> {
		await this.table.expectRowGone(this.rowByTitle(title));
	}

	/** The page, loaded, lists no row of `issueId`: nothing in the run carries it. */
	async expectIssueNotListed(issueId: number): Promise<void> {
		await this.expectLoaded();
		await this.table.expectRowGone(this.rowById(issueId));
	}

	async expectEffect(title: string, effect: RunIssueEffect): Promise<void> {
		const badge = this.effectBadge(this.rowByTitle(title));
		await expect(badge).toHaveAttribute('data-effect', effect, {
			timeout: 30_000
		});
		await expect(badge).toHaveText(EFFECT_BADGE[effect]);
	}

	async expectResultCountAtLeast(title: string, count: number): Promise<void> {
		await expect
			.poll(
				async () =>
					Number(
						(await this.resultCountButton(this.rowByTitle(title)).innerText())
							.trim()
							.replace(/\D/g, '')
					),
				{ timeout: 30_000, message: `results stamped under "${title}"` }
			)
			.toBeGreaterThanOrEqual(count);
	}

	async expectResultRowsAtLeast(count: number): Promise<void> {
		await expect
			.poll(() => this.resultRows().count(), { timeout: 30_000 })
			.toBeGreaterThanOrEqual(count);
	}

	async expectResultLinks(resultRow: Locator): Promise<void> {
		await expect(this.resultLink(resultRow, 'Run')).toBeVisible({
			timeout: 15_000
		});
		await expect(this.resultLink(resultRow, 'Log')).toBeVisible();
		await expect(this.resultLink(resultRow, 'History')).toBeVisible();
		await expect(this.resultPreviewButton(resultRow)).toBeVisible();
	}

	async expectAppliedToast(text: string): Promise<void> {
		expect(text).toMatch(/^Applied — (no new stamps|\d+ stamps? created)$/);
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	// --- Seeded classification: rows looked up by issue id ---

	/** The row's Effect On Run badge and its status stripe both name `effect`. */
	async expectIssueEffect(
		issueId: number,
		effect: RunIssueEffect
	): Promise<void> {
		const row = this.rowById(issueId);
		await this.table.expectRowListed(row);

		const badge = this.effectBadge(row);
		await expect(badge).toHaveAttribute('data-effect', effect, {
			timeout: 15_000
		});
		await expect(badge).toHaveText(EFFECT_BADGE[effect]);
		await expect(this.table.statusStripe(row)).toHaveAttribute(
			'data-status',
			EFFECT_DISPLAY[effect]
		);
	}

	/** The Categories cell shows one badge per distinct category, and no other. */
	async expectIssueCategories(
		issueId: number,
		categories: readonly IssueCategory[]
	): Promise<void> {
		const badges = this.rowById(issueId).locator(
			'[data-testid="tw-badge"][data-category]'
		);
		const distinct = [...new Set(categories)];

		await expect(badges).toHaveCount(distinct.length, { timeout: 15_000 });
		for (const category of distinct) {
			await expect(
				badges.and(this.page.locator(`[data-category="${category}"]`))
			).toHaveText(CATEGORY_BADGE[category]);
		}
	}

	/**
	 * Of the issues `among`, exactly `listed` are shown. Other issues the
	 * stack carries are left out of the comparison.
	 */
	async expectOnlyListed(
		among: readonly number[],
		listed: readonly number[]
	): Promise<void> {
		for (const issueId of among) {
			if (listed.includes(issueId)) {
				await this.table.expectRowListed(this.rowById(issueId));
			} else {
				await this.table.expectRowGone(this.rowById(issueId));
			}
		}
	}

	// --- Paging: the footer's compact pagination ---

	get nextPageButton(): Locator {
		return this.table.pagination.getByRole('button', { name: 'Next page' });
	}

	/** "Page 2 of 3" in the footer. */
	pagePosition(pageNumber: number): Locator {
		return this.table.pagination.getByText(
			new RegExp(`^Page ${pageNumber} of \\d+$`)
		);
	}

	async hasNextPage(): Promise<boolean> {
		return (
			(await this.nextPageButton.count()) > 0 &&
			(await this.nextPageButton.isEnabled())
		);
	}

	async openNextPage(pageNumber: number): Promise<void> {
		await this.nextPageButton.click();
		await this.expectOnPage(pageNumber);
	}

	async expectOnPage(pageNumber: number): Promise<void> {
		await expect(this.pagePosition(pageNumber)).toBeVisible({
			timeout: 15_000
		});
	}

	async expectRowCount(count: number): Promise<void> {
		await expect(this.rows()).toHaveCount(count, { timeout: 15_000 });
	}

	/** The issue ids of the rows on the page shown. */
	async listedIssueIds(): Promise<number[]> {
		const ids = await this.rows().evaluateAll((rows) =>
			rows.map((row) => row.getAttribute('data-issue-id'))
		);

		return ids.map(Number);
	}

	/**
	 * The footer reads "first–last of total issues", where the total counts at
	 * least `atLeast` issues: write scenarios may add issues to the run.
	 */
	async expectFooterRange(
		first: number,
		last: number,
		atLeast: number
	): Promise<void> {
		await expect(this.table.footerRange).toHaveText(
			new RegExp(`^${first}–${last} of \\d+ issues$`),
			{ timeout: 15_000 }
		);
		const text = (await this.table.footerRange.innerText()).trim();
		expect(Number(/of (\d+)/.exec(text)?.[1])).toBeGreaterThanOrEqual(atLeast);
	}

	// --- The results sub-table of an expanded row ---

	resultRowById(resultId: number): Locator {
		return this.resultsPanel.locator(
			`[data-testid="issue-result-row"][data-result-id="${resultId}"]`
		);
	}

	/** The Test cell names the test, with the packages above it beneath. */
	async expectResultTest(
		resultId: number,
		{ name, packagePath }: { name: string; packagePath: string }
	): Promise<void> {
		const row = this.resultRowById(resultId);
		await expect(row).toHaveCount(1, { timeout: 30_000 });
		await expect(row.getByText(name, { exact: true })).toBeVisible({
			timeout: 15_000
		});
		await expect(row.getByText(packagePath, { exact: true })).toBeVisible();
	}

	async expectResultVerdicts(
		resultId: number,
		verdicts: readonly string[]
	): Promise<void> {
		const row = this.resultRowById(resultId);
		for (const verdict of verdicts) {
			await expect(row.getByText(verdict.trim()).first()).toBeVisible({
				timeout: 15_000
			});
		}
	}
}

export { RUN_ISSUES_URL_PARAMS, RunIssuesPage };
export type { RunIssuesUrlParam };
