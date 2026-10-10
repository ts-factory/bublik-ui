/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { confirm, expectToast } from '../support/classification';
import { exactText } from '../support/e2e-data';
import { UrlParams, urlParams } from '../support/url-params';
import { ClassificationTable } from './classification-table';
import { ISSUE_URL_PARAMS } from './issue-page';
import { RuleDrawer } from './rule-drawer';

const ISSUE_RULES_URL_PARAMS = {
	...ISSUE_URL_PARAMS,
	q: {
		codec: 'raw',
		values: 'search text, matched against the test and the issue',
		whenAbsent: 'no search',
		writtenBy: 'the toolbar search'
	},
	sort: {
		codec: '<columnId>:asc | <columnId>:desc | none',
		values: 'issue | test | category | active',
		whenAbsent: 'issue:asc',
		writtenBy: 'the Issue and Test column headers'
	},
	issueState: {
		codec: '`;`-joined',
		values: 'open | closed',
		whenAbsent: 'rules of open and closed issues',
		writtenBy: 'the State filter and the State badge of a row'
	},
	project: {
		codec: 'raw',
		values: 'project id',
		whenAbsent: 'every project, grouped by project',
		writtenBy: 'the sidebar project picker'
	}
} as const;

type IssueRulesUrlParam = keyof typeof ISSUE_RULES_URL_PARAMS;

type ScopeChip = 'Path' | 'Params' | 'Verdicts' | 'Tags';

class IssueRulesPage {
	readonly root: Locator;
	readonly table: ClassificationTable;
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId('issue-rules-list-page');
		this.table = new ClassificationTable(page, this.root, {
			noun: 'rule',
			searchPlaceholder: 'Search test or issue',
			resetTestId: 'issue-rules-reset-filters',
			tableTestId: 'issue-rules-table'
		});
		this.url = urlParams(page);
	}

	/** The toolbar's New Rule button; the group headings carry one each as well. */
	get newRuleButton(): Locator {
		return this.root.getByTestId('rule-create').first();
	}

	get emptyState(): Locator {
		return this.root.getByText('No rules', { exact: true });
	}

	get detail(): Locator {
		return this.root.getByTestId('issue-rule-detail');
	}

	get scopeHoverCard(): Locator {
		return this.page.getByTestId('scope-hover-card');
	}

	rows(): Locator {
		return this.root.locator('[data-testid="issue-rule-row"]');
	}

	rowsByIssue(issueTitle: string): Locator {
		return this.rows().filter({
			has: this.page.getByRole('link', { name: issueTitle, exact: true })
		});
	}

	rowById(ruleId: number): Locator {
		return this.root.locator(
			`[data-testid="issue-rule-row"][data-rule-id="${ruleId}"]`
		);
	}

	testCell(row: Locator): Locator {
		return row.getByTestId('issue-rule-test');
	}

	scopeChip(row: Locator, chip: ScopeChip): Locator {
		return row
			.locator('[data-testid="tw-badge"]')
			.filter({ hasText: exactText(chip) });
	}

	/** A Tags / Verdicts / Parameters chip, shown once that column is on. */
	matcherChip(row: Locator, text: string): Locator {
		return row
			.locator('button[data-testid="tw-badge"]')
			.filter({ hasText: exactText(text) });
	}

	dispositionBadge(row: Locator): Locator {
		return row.locator('[data-testid="tw-badge"][data-disposition]');
	}

	activeBadge(row: Locator): Locator {
		return row.locator('[data-testid="tw-badge"][data-rule-active]');
	}

	issueStateBadge(row: Locator): Locator {
		return row.locator('[data-testid="tw-badge"][data-issue-state]');
	}

	expander(row: Locator): Locator {
		return row.getByTestId('issue-rule-expander');
	}

	editButton(row: Locator): Locator {
		return row.getByTestId('rule-edit');
	}

	deleteButton(row: Locator): Locator {
		return row.getByTestId('rule-delete');
	}

	loginRequiredAction(message: string): Locator {
		return this.page.getByRole('button', { name: message, exact: true });
	}

	async goto(params?: Record<string, string>): Promise<void> {
		const search = new URLSearchParams(params ?? {}).toString();

		await this.page.goto(`issues/rules${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(/\/issues\/rules(?:$|\?)/);
	}

	async expectLoaded(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await expect(this.page).toHaveTitle(/Rules - Issues - Bublik$/, {
			timeout: 15_000
		});
		await expect(this.table.table.or(this.emptyState)).toBeVisible({
			timeout: 30_000
		});
	}

	async openNewRule(): Promise<RuleDrawer> {
		await this.newRuleButton.click();
		const drawer = new RuleDrawer(this.page);
		await drawer.expectOpen('New Rule');

		return drawer;
	}

	/** The New Rule button in a project group's heading, which presets that project. */
	async openNewRuleInGroup(projectId: number): Promise<RuleDrawer> {
		await this.table.group(projectId).getByTestId('rule-create').click();
		const drawer = new RuleDrawer(this.page);
		await drawer.expectOpen('New Rule');

		return drawer;
	}

	async editRule(row: Locator): Promise<RuleDrawer> {
		await this.editButton(row).click();
		const drawer = new RuleDrawer(this.page);
		await drawer.expectOpen('Edit Rule');

		return drawer;
	}

	async deleteRule(row: Locator): Promise<void> {
		await this.deleteButton(row).click();
		await confirm(this.page, 'Delete this rule?', 'Delete');
		await expectToast(this.page, 'Rule deleted');
		await this.table.expectRowGone(row);
	}

	async hoverScopeChip(row: Locator, chip: ScopeChip): Promise<void> {
		await this.scopeChip(row, chip).hover();
		await expect(this.scopeHoverCard).toBeVisible({ timeout: 15_000 });
	}

	/** The values a Match Scope chip stands for, as its hover card lists them. */
	async scopeValues(row: Locator, chip: ScopeChip): Promise<string[]> {
		await this.hoverScopeChip(row, chip);
		const values = await this.scopeHoverCard
			.locator('[data-testid="tw-badge"]')
			.allInnerTexts();
		await this.page.mouse.move(0, 0);
		await expect(this.scopeHoverCard).toBeHidden({ timeout: 15_000 });

		return values.map((value) => value.trim());
	}

	async expandRow(row: Locator): Promise<void> {
		await this.expander(row).click();
		await expect(this.detail).toBeVisible({ timeout: 15_000 });
	}

	async expectRuleListed(row: Locator): Promise<void> {
		await this.table.expectRowListed(row);
	}

	async expectRuleActive(row: Locator, active: boolean): Promise<void> {
		await expect(row).toHaveAttribute('data-rule-active', String(active), {
			timeout: 15_000
		});
	}

	async expectDisposition(
		row: Locator,
		label: 'Expected' | 'Unexpected' | 'Marked'
	): Promise<void> {
		await expect(this.dispositionBadge(row)).toHaveText(label, {
			timeout: 15_000
		});
	}

	async expectScopeChips(row: Locator, chips: ScopeChip[]): Promise<void> {
		for (const chip of chips) {
			await expect(this.scopeChip(row, chip)).toBeVisible({ timeout: 15_000 });
		}
	}

	/** The row's Match Scope reads `chips`, in order, and nothing else. */
	async expectScopeChipsExactly(
		row: Locator,
		chips: readonly ScopeChip[]
	): Promise<void> {
		await expect(
			row
				.locator('[data-testid="tw-badge"]')
				.filter({ hasText: /^\s*(Path|Params|Verdicts|Tags)\s*$/ })
		).toHaveText([...chips], { timeout: 15_000 });
	}

	async expectScopeHoverCardLists(value: string): Promise<void> {
		await expect(
			this.scopeHoverCard
				.locator('[data-testid="tw-badge"]')
				.filter({ hasText: exactText(value) })
		).toBeVisible({ timeout: 15_000 });
	}

	/** A Tags / Verdicts / Parameters chip reading `text`, once that column is on. */
	async expectMatcherChip(row: Locator, text: string): Promise<void> {
		await expect(this.matcherChip(row, text)).toBeVisible({ timeout: 15_000 });
	}

	async expectScopeHoverCardTitled(title: string): Promise<void> {
		await expect(
			this.scopeHoverCard.getByText(title, { exact: true })
		).toBeVisible({ timeout: 15_000 });
	}

	/**
	 * The row's status stripe reads `status` — what the rule's disposition does
	 * under its issue's state — and is faded exactly when the rule is inactive.
	 */
	async expectStripe(
		row: Locator,
		status: string,
		{ muted }: { muted: boolean }
	): Promise<void> {
		const stripe = this.table.statusStripe(row);

		await expect(stripe).toHaveAttribute('data-status', status, {
			timeout: 15_000
		});
		await this.expectMuted(row, muted);
	}

	/** An inactive rule keeps its stripe's colour, faded. */
	async expectMuted(row: Locator, muted: boolean): Promise<void> {
		const stripe = this.table.statusStripe(row);

		if (muted) {
			await expect(stripe).toHaveAttribute('data-muted', 'true', {
				timeout: 15_000
			});
		} else {
			await expect(stripe).not.toHaveAttribute('data-muted', /.*/, {
				timeout: 15_000
			});
		}
	}

	async expectStripeTooltip(row: Locator, text: RegExp): Promise<void> {
		await this.table.statusStripe(row).hover();
		await expect(this.page.getByRole('tooltip').first()).toHaveText(text, {
			timeout: 15_000
		});
	}

	async expectActiveBadge(
		row: Locator,
		label: 'Active' | 'Inactive'
	): Promise<void> {
		await expect(this.activeBadge(row)).toHaveText(label, { timeout: 15_000 });
	}

	get nextPageButton(): Locator {
		return this.table.pagination.getByRole('button', { name: 'Next page' });
	}

	async hasNextPage(): Promise<boolean> {
		return (
			(await this.nextPageButton.count()) > 0 &&
			(await this.nextPageButton.isEnabled())
		);
	}

	async openNextPage(): Promise<void> {
		await this.nextPageButton.click();
	}

	/** The ids of the rules on this page, top to bottom. */
	async ruleIdsOnPage(): Promise<number[]> {
		await expect(this.rows().first()).toHaveCount(1, { timeout: 30_000 });

		return this.rows().evaluateAll((rows) =>
			rows.map((row) => Number(row.getAttribute('data-rule-id')))
		);
	}

	/** The ids on this page once it no longer shows the page `previous` came from. */
	async ruleIdsOnPageOtherThan(previous: readonly number[]): Promise<number[]> {
		let ids: number[] = [];
		await expect(async () => {
			ids = await this.ruleIdsOnPage();
			expect(ids).not.toEqual(previous);
		}).toPass({ timeout: 30_000 });

		return ids;
	}

	async expectRuleCount(count: number): Promise<void> {
		await expect(this.rows()).toHaveCount(count, { timeout: 30_000 });
	}

	async expectRowsPerPage(size: number): Promise<void> {
		await expect(this.table.rowsPerPage).toHaveText(String(size), {
			timeout: 15_000
		});
	}

	/** Every rule on the page shows a badge or chip reading `text`. */
	async expectEveryRuleShows(text: string): Promise<void> {
		await expect(this.rows().first()).toHaveCount(1, { timeout: 30_000 });
		for (const row of await this.rows().all()) {
			await expect(
				row
					.locator('[data-testid="tw-badge"]')
					.filter({ hasText: exactText(text) })
					.first()
			).toBeVisible({ timeout: 15_000 });
		}
	}

	async expectCompactRow(row: Locator): Promise<void> {
		await expect(this.expander(row)).toBeVisible({ timeout: 15_000 });
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectRepeatedParam(
		key: IssueRulesUrlParam,
		values: readonly string[]
	): Promise<void> {
		await this.url.expectRepeated(key, values);
	}
}

export { ISSUE_RULES_URL_PARAMS, IssueRulesPage };
export type { IssueRulesUrlParam, ScopeChip };
