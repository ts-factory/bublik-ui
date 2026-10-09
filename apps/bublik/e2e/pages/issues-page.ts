/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import {
	CATEGORY_BADGE,
	confirm,
	escapeRegExp,
	expectToast,
	RULES_STATE_LABEL
} from '../support/classification';
import type { IssueCategory } from '../support/classification';
import { UrlParams, urlParams } from '../support/url-params';
import { ClassificationTable } from './classification-table';
import { IssueDrawer, type IssueInput } from './issue-drawer';

const ISSUES_URL_PARAMS = {
	page: {
		codec: 'PageParam',
		values: '1-based page number',
		whenAbsent: 'the first page',
		writtenBy:
			'the footer pagination; forced back to 1 by any search or filter change, and absent when it is 1'
	},
	pageSize: {
		codec: 'raw, one of 10 | 25 | 50 | 75 | 100',
		values: 'rows per page',
		whenAbsent: '100',
		writtenBy: 'the Rows select in the footer; absent at the default'
	},
	q: {
		codec: 'raw',
		values: 'search text',
		whenAbsent: 'no search',
		writtenBy: 'the toolbar search, debounced 300ms'
	},
	sort: {
		codec: '<columnId>:asc | <columnId>:desc | none',
		values: 'issue | created | state',
		whenAbsent: 'created:desc',
		writtenBy: 'the Issue, Created and State column headers'
	},
	open: {
		codec: '`;`-joined row ids',
		values: 'expanded row ids',
		whenAbsent: 'nothing is expanded',
		writtenBy: 'nothing here — the issues table has no sub-rows'
	},
	cols: {
		codec: '`;`-joined visibility overrides',
		values: '-<columnId> | +<columnId>, sorted',
		whenAbsent: 'the default set (Created hidden), or the localStorage choice',
		writtenBy:
			'the Columns menu; mirrored to localStorage `bublik.columns.issues-v2`'
	},
	order: {
		codec: '`;`-joined column ids',
		values: 'the movable columns, left to right',
		whenAbsent: 'the default order, or the localStorage choice',
		writtenBy: 'dragging a row of the Columns menu'
	},
	state: {
		codec: '`;`-joined',
		values: 'open | closed',
		whenAbsent: 'both states',
		writtenBy: 'the State filter and the State badge of a row'
	},
	categories: {
		codec: '`;`-joined',
		values: 'category slugs',
		whenAbsent: 'every category',
		writtenBy: 'the Category filter and the category badges of a row'
	},
	rules: {
		codec: '`;`-joined',
		values: 'enforced | dormant | deactivated | unruled',
		whenAbsent: 'every rules state',
		writtenBy: 'the Rules filter and the Rules badge of a row'
	},
	project: {
		codec: 'raw',
		values: 'project id',
		whenAbsent: 'every project, grouped by project',
		writtenBy: 'the sidebar project picker'
	}
} as const;

type IssuesUrlParam = keyof typeof ISSUES_URL_PARAMS;

/** `rules_state` → the colour its status stripe is painted (`classification.tokens.ts`). */
const RULES_STATE_STRIPE = {
	enforced: 'bg-bg-ok',
	dormant: 'bg-bg-triage',
	deactivated: 'bg-bg-warning',
	unruled: 'bg-bg-compromised'
} as const satisfies Record<keyof typeof RULES_STATE_LABEL, string>;

class IssuesPage {
	readonly root: Locator;
	readonly table: ClassificationTable;
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId('issues-page');
		this.table = new ClassificationTable(page, this.root, {
			noun: 'issue',
			searchPlaceholder: 'Search title, description or key',
			resetTestId: 'issues-reset-filters',
			tableTestId: 'issues-table'
		});
		this.url = urlParams(page);
	}

	/** The toolbar's New Issue button; the group headings carry one each as well. */
	get newIssueButton(): Locator {
		return this.root.getByTestId('issue-create').first();
	}

	get emptyState(): Locator {
		return this.root.getByText('No issues', { exact: true });
	}

	rows(): Locator {
		return this.root.locator('[data-testid="issue-row"]');
	}

	rowByTitle(title: string): Locator {
		return this.rows().filter({
			has: this.page.getByRole('link', { name: title, exact: true })
		});
	}

	rowById(issueId: number): Locator {
		return this.root.locator(
			`[data-testid="issue-row"][data-issue-id="${issueId}"]`
		);
	}

	titleLink(row: Locator, title: string): Locator {
		return row.getByRole('link', { name: title, exact: true });
	}

	keyLink(row: Locator): Locator {
		return row.getByTestId('issue-key-link');
	}

	bugLink(row: Locator): Locator {
		return row.getByTestId('issue-bug-link');
	}

	stateBadge(row: Locator): Locator {
		return row.locator('[data-testid="tw-badge"][data-issue-state]');
	}

	categoryBadge(row: Locator, slug: string): Locator {
		return row.locator(`[data-category="${slug}"]`);
	}

	rulesBadge(row: Locator): Locator {
		return row.locator('[data-rules-state]');
	}

	resultCount(row: Locator): Locator {
		return row.getByTestId('issue-result-count');
	}

	editButton(row: Locator): Locator {
		return row.getByTestId('issue-edit');
	}

	deleteButton(row: Locator): Locator {
		return row.getByTestId('issue-delete');
	}

	/** The inert wrapper a write action becomes while signed out. */
	loginRequiredAction(message: string): Locator {
		return this.page.getByRole('button', { name: message, exact: true });
	}

	async goto(params?: Record<string, string>): Promise<void> {
		const search = new URLSearchParams(params ?? {}).toString();

		await this.page.goto(`issues${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(/\/issues(?:$|\?)/);
	}

	async expectLoaded(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await expect(this.page).toHaveTitle(/Issues - Bublik$/, {
			timeout: 15_000
		});
		await expect(this.table.table.or(this.emptyState)).toBeVisible({
			timeout: 30_000
		});
	}

	async openNewIssue(): Promise<IssueDrawer> {
		await this.newIssueButton.click();
		const drawer = new IssueDrawer(this.page);
		await drawer.expectOpen('New Issue');

		return drawer;
	}

	/** The New Issue button in the heading of project `projectId`'s group. */
	async openNewIssueInGroup(projectId: number): Promise<IssueDrawer> {
		await this.table.group(projectId).getByTestId('issue-create').click();
		const drawer = new IssueDrawer(this.page);
		await drawer.expectOpen('New Issue');

		return drawer;
	}

	/**
	 * Records an issue through the drawer and reads its id back from the row the
	 * search then shows. The page must be scoped to the issue's project or the
	 * input must name one.
	 */
	async createIssue(input: IssueInput & { title: string }): Promise<number> {
		const drawer = await this.openNewIssue();
		await drawer.fill(input);
		await drawer.submit();
		await expectToast(this.page, 'Issue created');
		await drawer.expectClosed();

		await this.table.search(input.title);
		const row = this.rowByTitle(input.title);
		await this.table.expectRowListed(row);

		return Number(await row.getAttribute('data-issue-id'));
	}

	async openEdit(row: Locator): Promise<IssueDrawer> {
		await this.editButton(row).click();
		const drawer = new IssueDrawer(this.page);
		await drawer.expectOpen('Edit Issue');

		return drawer;
	}

	async requestDelete(row: Locator): Promise<void> {
		await this.deleteButton(row).click();
	}

	async deleteIssue(title: string): Promise<void> {
		const row = this.rowByTitle(title);
		await this.table.expectRowListed(row);
		await this.requestDelete(row);
		await confirm(this.page, `Delete ${title}?`, 'Delete');
		await expectToast(this.page, 'Issue deleted');
		await this.table.expectRowGone(row);
	}

	async openIssue(title: string): Promise<void> {
		await this.titleLink(this.rowByTitle(title), title).click();
		await expect(this.page).toHaveURL(/\/issues\/\d+/, { timeout: 15_000 });
	}

	async expectIssueListed(title: string): Promise<void> {
		await this.table.expectRowListed(this.rowByTitle(title));
	}

	/** The issue is listed under the heading of project `projectId`. */
	async expectIssueInGroup(issueId: number, projectId: number): Promise<void> {
		await this.table.expectRowInGroup(this.rowById(issueId), projectId);
	}

	async expectIssueGone(title: string): Promise<void> {
		await this.table.expectRowGone(this.rowByTitle(title));
	}

	async expectIssueState(
		title: string,
		state: 'open' | 'closed'
	): Promise<void> {
		const row = this.rowByTitle(title);
		await expect(row).toHaveAttribute('data-issue-state', state, {
			timeout: 15_000
		});
		await expect(this.stateBadge(row)).toHaveText(
			state === 'open' ? 'Open' : 'Closed'
		);
	}

	async expectRulesBadge(
		title: string,
		rulesState: string,
		text: string | RegExp
	): Promise<void> {
		const badge = this.rulesBadge(this.rowByTitle(title));
		await expect(badge).toHaveAttribute('data-rules-state', rulesState, {
			timeout: 15_000
		});
		await expect(badge).toHaveText(text);
	}

	/**
	 * The row's stripe and Rules badge both name `rulesState`; the badge reads
	 * `ruleCount` ("2 of 3 active") when the issue has rules, the state otherwise.
	 */
	async expectRulesStateOf(
		issueId: number,
		rulesState: keyof typeof RULES_STATE_LABEL,
		ruleCount?: string
	): Promise<void> {
		const row = this.rowById(issueId);
		const label = RULES_STATE_LABEL[rulesState];
		const stripe = this.table.statusStripe(row);
		const badge = this.rulesBadge(row);

		await this.table.expectRowListed(row);
		await expect(stripe).toHaveAttribute('data-status', label);
		await expect(stripe).toHaveClass(
			new RegExp(`(^|\\s)${RULES_STATE_STRIPE[rulesState]}(\\s|$)`)
		);
		await expect(stripe).not.toHaveAttribute('data-muted', 'true');
		await expect(badge).toHaveAttribute('data-rules-state', rulesState);
		await expect(badge).toHaveText(ruleCount ?? label);
	}

	/**
	 * The `title` filter offers `label` and counts at least `atLeast` issues
	 * for it: other scenarios may add issues at any time.
	 */
	async expectFacetCountAtLeast(
		title: string,
		label: string,
		atLeast: number
	): Promise<void> {
		const option = this.table.facetOption(label);

		await this.table.facet(title).click();
		await expect(option).toBeVisible({ timeout: 15_000 });
		await expect(async () => {
			const name = (await option.textContent()) ?? '';
			const count = Number(/\((\d+)\)\s*$/.exec(name)?.[1]);
			expect(count, `${title} › ${label} count`).toBeGreaterThanOrEqual(
				atLeast
			);
		}).toPass({ timeout: 15_000 });
		await this.page.keyboard.press('Escape');
		await expect(option).toBeHidden({ timeout: 15_000 });
	}

	async expectClosedRow(issueId: number): Promise<void> {
		const row = this.rowById(issueId);

		await this.table.expectRowListed(row);
		await expect(row).toHaveAttribute('data-issue-state', 'closed');
		await expect(this.stateBadge(row)).toHaveText('Closed');
	}

	/** The Key column strikes a closed issue's key through. */
	async expectKeyStruckThrough(issueId: number): Promise<void> {
		const key = this.keyLink(this.rowById(issueId));

		await expect(key).toBeVisible({ timeout: 30_000 });
		await expect(key).toHaveAttribute('data-issue-state', 'closed');
		await expect(key).toHaveCSS('text-decoration-line', 'line-through');
	}

	/**
	 * The Key column reads `text` and links out to `href` — or, with `href`
	 * null, has no link to the tracker.
	 */
	async expectKeyOf(
		issueId: number,
		text: string,
		href: string | null
	): Promise<void> {
		const row = this.rowById(issueId);

		await expect(this.keyLink(row)).toHaveText(text, { timeout: 30_000 });
		if (href === null) {
			await expect(this.bugLink(row)).toHaveCount(0);
		} else {
			await expect(this.bugLink(row)).toHaveAttribute('href', href);
		}
	}

	/**
	 * The row's description opens in a popover headed by `title` that holds
	 * each of `fragments` as text, then closes again.
	 */
	async expectDescriptionShows(
		issueId: number,
		title: string,
		fragments: readonly string[]
	): Promise<void> {
		const popover = this.table.descriptionPopover;

		await this.table.openDescription(this.rowById(issueId));
		await expect(
			popover.getByRole('heading', { name: title, exact: true })
		).toBeVisible();
		for (const fragment of fragments) {
			await expect(
				popover.getByTestId('description-popover-body')
			).toContainText(fragment);
		}
		await this.page.keyboard.press('Escape');
		await expect(popover).toBeHidden({ timeout: 15_000 });
	}

	/** The footer's "Page N of M". */
	get footerPosition(): Locator {
		return this.table.pagination.getByText(/^Page \d+ of \d+$/);
	}

	async goToNextPage(): Promise<void> {
		await this.table.pagination
			.getByRole('button', { name: 'Next page', exact: true })
			.click();
	}

	private async readPagePosition(): Promise<{ page: number; pages: number }> {
		const text = (await this.footerPosition.textContent()) ?? '';
		const [, current, last] = /Page (\d+) of (\d+)/.exec(text) ?? [];

		return { page: Number(current), pages: Number(last) };
	}

	/** The footer is on `page`, of at least `atLeastPages` pages. */
	async expectPage(
		page: number,
		{ atLeastPages }: { atLeastPages: number }
	): Promise<void> {
		await expect(async () => {
			const position = await this.readPagePosition();
			expect(position.page, 'current page').toBe(page);
			expect(position.pages, 'page count').toBeGreaterThanOrEqual(atLeastPages);
		}).toPass({ timeout: 30_000 });
	}

	/**
	 * The page asked for lay past the end, so the table moved to its last page:
	 * the footer says so, the URL names it, and the range starts on that page.
	 */
	async expectClampedToLastPage({
		atLeastPages
	}: {
		atLeastPages: number;
	}): Promise<void> {
		let last = 0;

		await expect(async () => {
			const position = await this.readPagePosition();
			expect(position.pages, 'page count').toBeGreaterThanOrEqual(atLeastPages);
			expect(position.page, 'current page').toBe(position.pages);
			last = position.pages;
		}).toPass({ timeout: 30_000 });
		await this.url.expect({ page: String(last) });
		await expect(this.table.footerRange).toHaveText(
			new RegExp(`^${(last - 1) * 10 + 1}–\\d+ of `)
		);
	}

	async expectRowCount(count: number): Promise<void> {
		await expect(this.rows()).toHaveCount(count, { timeout: 30_000 });
	}

	/** The footer's range runs from `first` to `last`, whatever total it gives. */
	async expectRangeSpans(first: number, last: number): Promise<void> {
		await expect(this.table.footerRange).toHaveText(
			new RegExp(`^${first}–${last} of \\d+ `),
			{ timeout: 30_000 }
		);
	}

	/**
	 * The footer reads "`first`–`last` of N issues" with N at least `atLeast`:
	 * the total is every issue, not the page.
	 */
	async expectRangeOfTotal(
		first: number,
		last: number,
		{ atLeast }: { atLeast: number }
	): Promise<void> {
		const pattern = new RegExp(`^${first}–${last} of (\\d+) issues$`);

		await expect(this.table.footerRange).toHaveText(pattern, {
			timeout: 30_000
		});
		const text = (await this.table.footerRange.textContent()) ?? '';
		expect(
			Number(pattern.exec(text)?.[1]),
			'issues counted'
		).toBeGreaterThanOrEqual(atLeast);
	}

	/** The URL's `order` lists column `columnId` before `beforeColumnId`. */
	async expectOrderParamPuts(
		columnId: string,
		beforeColumnId: string
	): Promise<void> {
		await expect
			.poll(
				() => {
					const order = (this.url.get('order') ?? '').split(';');
					const at = order.indexOf(columnId);

					return at >= 0 && at < order.indexOf(beforeColumnId);
				},
				{
					timeout: 15_000,
					message: `order puts ${columnId} before ${beforeColumnId}`
				}
			)
			.toBe(true);
	}

	/** Forgets the column order this browser stored, so only the URL can restore it. */
	async forgetStoredColumnOrder(): Promise<void> {
		await this.page.evaluate(() =>
			window.localStorage.removeItem('bublik.column-order.issues-v2')
		);
	}

	async expectResultCount(title: string, count: number): Promise<void> {
		await expect(this.resultCount(this.rowByTitle(title))).toHaveText(
			String(count),
			{ timeout: 15_000 }
		);
	}

	async expectKey(title: string, key: string): Promise<void> {
		await expect(this.keyLink(this.rowByTitle(title))).toHaveText(key, {
			timeout: 15_000
		});
	}

	/** The issue's Categories cell carries `category`'s badge. */
	async expectCategory(title: string, category: IssueCategory): Promise<void> {
		await expect(
			this.categoryBadge(this.rowByTitle(title), category)
		).toHaveText(CATEGORY_BADGE[category], { timeout: 15_000 });
	}

	/** The key's external link points at the tracker's page for `key`. */
	async expectBugLink(title: string, key: string): Promise<void> {
		await expect(this.bugLink(this.rowByTitle(title))).toHaveAttribute(
			'href',
			new RegExp(`${escapeRegExp(key)}$`),
			{ timeout: 15_000 }
		);
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsAbsent(keys: readonly IssuesUrlParam[]): Promise<void> {
		await this.url.expectAbsent(keys);
	}

	async expectParamWritten(key: IssuesUrlParam): Promise<void> {
		await this.url.expectWritten(key);
	}

	async expectParamContains(key: IssuesUrlParam, value: string): Promise<void> {
		await this.url.expectDelimitedContains(key, value);
	}
}

export { ISSUES_URL_PARAMS, IssuesPage };
export type { IssuesUrlParam };
