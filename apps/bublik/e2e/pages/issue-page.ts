/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { confirm, expectToast } from '../support/classification';
import { exactText } from '../support/e2e-data';
import { UrlParams, urlParams } from '../support/url-params';
import { ClassificationTable } from './classification-table';
import { IssueDrawer } from './issue-drawer';
import { RuleDrawer } from './rule-drawer';

/** The rules table on an issue's page writes the same params as the rules page, minus `issueState`. */
const ISSUE_URL_PARAMS = {
	page: {
		codec: 'PageParam',
		values: '1-based page number',
		whenAbsent: 'the first page',
		writtenBy: 'the rules table footer'
	},
	pageSize: {
		codec: 'raw, one of 10 | 25 | 50 | 75 | 100',
		values: 'rules per page',
		whenAbsent: '100',
		writtenBy: 'the Rows select in the rules table footer'
	},
	q: {
		codec: 'raw',
		values: 'search text, matched against the test',
		whenAbsent: 'no search',
		writtenBy: 'the rules table search'
	},
	sort: {
		codec: '<columnId>:asc | <columnId>:desc | none',
		values: 'test | category | active',
		whenAbsent: 'issue:asc, which on one issue is insertion order',
		writtenBy: 'the Test column header'
	},
	open: {
		codec: '`;`-joined rule ids',
		values: 'rules whose detail panel is open',
		whenAbsent: 'no detail panel',
		writtenBy: 'the row expander, in the compact layout only'
	},
	cols: {
		codec: '`;`-joined visibility overrides',
		values: '-<columnId> | +<columnId>',
		whenAbsent: 'Tags, Verdicts, Parameters and Disposition hidden',
		writtenBy:
			'the Columns menu; mirrored to localStorage `bublik.columns.issue-rules-v3`'
	},
	order: {
		codec: '`;`-joined column ids',
		values: 'the movable columns, left to right',
		whenAbsent: 'the default order',
		writtenBy: 'dragging a row of the Columns menu'
	},
	category: {
		codec: '`;`-joined',
		values: 'category slugs',
		whenAbsent: 'every category',
		writtenBy: 'the Category filter and the Category badge of a row'
	},
	disposition: {
		codec: '`;`-joined',
		values: 'expected | unexpected | none',
		whenAbsent: 'every disposition',
		writtenBy: 'the Disposition filter and the Disposition badge of a row'
	},
	active: {
		codec: '`;`-joined',
		values: 'true | false',
		whenAbsent: 'active and inactive rules',
		writtenBy: 'the Rule filter and the Active badge of a row'
	},
	tags: {
		codec: 'repeated — the key is written once per value',
		values: 'tag matcher values',
		whenAbsent: 'every rule',
		writtenBy: 'the Tags filter and the tag chips of a row'
	},
	verdicts: {
		codec: 'repeated',
		values: 'verdict matcher values',
		whenAbsent: 'every rule',
		writtenBy: 'the Verdicts filter and the verdict chips of a row'
	},
	parameters: {
		codec: 'repeated',
		values: 'name=value matcher values',
		whenAbsent: 'every rule',
		writtenBy: 'the Parameters filter and the parameter chips of a row'
	}
} as const;

type IssueUrlParam = keyof typeof ISSUE_URL_PARAMS;

class IssuePage {
	readonly root: Locator;
	readonly rulesTable: ClassificationTable;
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId('issue-page');
		this.rulesTable = new ClassificationTable(page, this.root, {
			noun: 'rule',
			searchPlaceholder: 'Search test',
			resetTestId: 'issue-rules-reset-filters',
			tableTestId: 'issue-rules-table'
		});
		this.url = urlParams(page);
	}

	get heading(): Locator {
		return this.root.getByRole('heading', { level: 1 });
	}

	/** The facts block: Key, Rules, Created, Updated and, once closed, Closed. */
	get header(): Locator {
		return this.root.getByTestId('issue-detail-header');
	}

	get headerBar(): Locator {
		return this.root.getByRole('banner');
	}

	get closeButton(): Locator {
		return this.root.getByTestId('issue-close');
	}

	get reopenButton(): Locator {
		return this.root.getByTestId('issue-reopen');
	}

	get editButton(): Locator {
		return this.root.getByTestId('issue-edit');
	}

	get deleteButton(): Locator {
		return this.root.getByTestId('issue-delete');
	}

	get rulesBadge(): Locator {
		return this.header.locator('[data-rules-state]');
	}

	get description(): Locator {
		return this.root.getByTestId('issue-detail-description');
	}

	get newRuleButton(): Locator {
		return this.root.getByTestId('rule-create');
	}

	get noRulesYet(): Locator {
		return this.root.getByText(
			'This issue has no rules yet. Write one here, or classify a failing result against this issue.'
		);
	}

	get invalidId(): Locator {
		return this.page.getByText('Issue ID is missing or invalid', {
			exact: true
		});
	}

	fact(label: 'Key' | 'Rules' | 'Created' | 'Updated' | 'Closed'): Locator {
		return this.header
			.locator('dt')
			.filter({ hasText: exactText(label) })
			.locator('xpath=following-sibling::dd[1]');
	}

	ruleRows(): Locator {
		return this.root.locator('[data-testid="issue-rule-row"]');
	}

	ruleRow(ruleId: number): Locator {
		return this.root.locator(
			`[data-testid="issue-rule-row"][data-rule-id="${ruleId}"]`
		);
	}

	ruleRowByTest(testName: string): Locator {
		return this.ruleRows().filter({
			has: this.page.getByTestId('issue-rule-test').filter({
				hasText: exactText(testName)
			})
		});
	}

	ruleEditButton(row: Locator): Locator {
		return row.getByTestId('rule-edit');
	}

	ruleDeleteButton(row: Locator): Locator {
		return row.getByTestId('rule-delete');
	}

	ruleActiveBadge(row: Locator): Locator {
		return row.locator('[data-testid="tw-badge"][data-rule-active]');
	}

	loginRequiredAction(message: string): Locator {
		return this.page.getByRole('button', { name: message, exact: true });
	}

	async goto(
		issueId: number | string,
		params?: Record<string, string>
	): Promise<void> {
		const search = new URLSearchParams(params ?? {}).toString();

		await this.page.goto(`issues/${issueId}${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(new RegExp(`/issues/${issueId}`));
	}

	async expectLoaded(title: string): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await expect(this.heading).toHaveText(title, { timeout: 30_000 });
		await expect(this.header).toBeVisible({ timeout: 30_000 });
		await expect(this.page).toHaveTitle(
			new RegExp(`${escapeRegExp(title)} - Issue - Bublik$`),
			{ timeout: 15_000 }
		);
	}

	async expectRulesReady(): Promise<void> {
		await expect(this.rulesTable.table.or(this.noRulesYet)).toBeVisible({
			timeout: 30_000
		});
	}

	async close(): Promise<void> {
		await this.closeButton.click();
		await expectToast(this.page, 'Issue closed');
	}

	async reopen(): Promise<void> {
		await this.reopenButton.click();
		await expectToast(this.page, 'Issue reopened');
	}

	async openEdit(): Promise<IssueDrawer> {
		await this.editButton.click();
		const drawer = new IssueDrawer(this.page);
		await drawer.expectOpen('Edit Issue');

		return drawer;
	}

	async deleteIssue(title: string): Promise<void> {
		await this.deleteButton.click();
		await confirm(this.page, `Delete ${title}?`, 'Delete');
		await expectToast(this.page, 'Issue deleted');
		await expect(this.page).toHaveURL(/\/issues(?:$|\?)/, { timeout: 15_000 });
	}

	async openNewRule(): Promise<RuleDrawer> {
		await this.newRuleButton.click();
		const drawer = new RuleDrawer(this.page);
		await drawer.expectOpen('New Rule');

		return drawer;
	}

	async editRule(row: Locator): Promise<RuleDrawer> {
		await this.ruleEditButton(row).click();
		const drawer = new RuleDrawer(this.page);
		await drawer.expectOpen('Edit Rule');

		return drawer;
	}

	async deleteRule(row: Locator): Promise<void> {
		await this.ruleDeleteButton(row).click();
		await confirm(this.page, 'Delete this rule?', 'Delete');
		await expectToast(this.page, 'Rule deleted');
	}

	async expectState(state: 'open' | 'closed'): Promise<void> {
		await expect(this.header).toHaveAttribute('data-issue-state', state, {
			timeout: 15_000
		});
		// The `<header>` wraps the facts too, where a closed issue lists a
		// "Closed" time; the state badge is the one with the badge test id.
		await expect(
			this.headerBar
				.locator('[data-testid="tw-badge"]')
				.filter({ hasText: exactText(state === 'open' ? 'Open' : 'Closed') })
				.first()
		).toBeVisible({ timeout: 15_000 });
	}

	async expectRulesState(
		rulesState: 'enforced' | 'dormant' | 'deactivated' | 'unruled',
		text: string | RegExp
	): Promise<void> {
		await expect(this.rulesBadge).toHaveAttribute(
			'data-rules-state',
			rulesState,
			{ timeout: 15_000 }
		);
		await expect(this.rulesBadge).toHaveText(text);
	}

	async expectFactsListed(
		labels: readonly ('Key' | 'Rules' | 'Created' | 'Updated' | 'Closed')[]
	): Promise<void> {
		for (const label of labels) {
			// The Key value is empty — and so has no box — until a bug key is set.
			await expect(
				this.header.locator('dt').filter({ hasText: exactText(label) })
			).toBeVisible({ timeout: 15_000 });
			await expect(this.fact(label)).toBeAttached({ timeout: 15_000 });
		}
	}

	async expectNoClosedFact(): Promise<void> {
		await expect(this.fact('Closed')).toHaveCount(0);
	}

	async expectDescription(text: string): Promise<void> {
		await expect(this.description).toContainText(text, { timeout: 15_000 });
	}

	async expectNoRulesYet(): Promise<void> {
		await expect(this.noRulesYet).toBeVisible({ timeout: 30_000 });
	}

	async expectRuleListed(row: Locator): Promise<void> {
		await this.rulesTable.expectRowListed(row);
	}

	async expectRuleActive(row: Locator, active: boolean): Promise<void> {
		await expect(row).toHaveAttribute('data-rule-active', String(active), {
			timeout: 15_000
		});
		await expect(this.ruleActiveBadge(row)).toHaveText(
			active ? 'Active' : 'Inactive'
		);
	}

	async expectInvalidId(): Promise<void> {
		await expect(this.invalidId).toBeVisible({ timeout: 30_000 });
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	// --- Seeded classification: the description block and the Closed fact ---

	/** A static block when the description fits, a button when it is clipped. */
	get descriptionBlock(): Locator {
		return this.description.getByTestId('description-block');
	}

	get descriptionPopover(): Locator {
		return this.page.getByTestId('description-popover');
	}

	async openDescription(): Promise<void> {
		await this.descriptionBlock.click();
		await expect(this.descriptionPopover).toBeVisible({ timeout: 15_000 });
	}

	async expectDescriptionClipped(): Promise<void> {
		await expect(this.descriptionBlock).toHaveRole('button', {
			timeout: 15_000
		});
		await expect(this.descriptionBlock).toHaveAccessibleName(
			'Show full description'
		);
	}

	async expectDescriptionPopover(text: string): Promise<void> {
		await expect(
			this.descriptionPopover.getByTestId('description-popover-body')
		).toContainText(text);
	}

	async expectDescriptionInline(text: string): Promise<void> {
		await expect(this.descriptionBlock).toBeVisible({ timeout: 15_000 });
		await expect(this.descriptionBlock).not.toHaveRole('button');
		await expect(
			this.description.getByRole('button', { name: 'Show full description' })
		).toHaveCount(0);
		await expect(this.descriptionBlock.getByText(text)).toBeVisible();
	}

	/** The Closed fact shows a date, e.g. "October 09, 2026, 19:42 GMT+3". */
	async expectClosedDate(): Promise<void> {
		await expect(this.fact('Closed')).toHaveText(
			/^[A-Z][a-z]+ \d{2}, \d{4}\b/,
			{ timeout: 15_000 }
		);
	}
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export { ISSUE_URL_PARAMS, IssuePage };
export type { IssueUrlParam };
