/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { UrlParams, urlParams } from '../support/url-params';
import {
	ClassificationTable,
	classificationUrlParams,
	facetParam
} from './classification-table-url';

/** The facets every rules table offers; the all-rules page adds the issue's state. */
const RULE_FACET_PARAMS = {
	category: facetParam(
		'Category',
		'product-defect | test-bug | env | known-issue | flaky | to-investigate',
		'rules'
	),
	disposition: facetParam(
		'Disposition',
		'expected | unexpected | none',
		'rules'
	),
	active: facetParam('Rule', 'true | false', 'rules'),
	tags: facetParam('Tags', 'tag names the page’s rules match on', 'rules'),
	verdicts: facetParam(
		'Verdicts',
		'verdicts the page’s rules match on',
		'rules'
	),
	parameters: facetParam(
		'Parameters',
		'`name=value` pairs the page’s rules match on',
		'rules'
	)
} as const;

const ISSUE_RULES_URL_PARAMS = {
	...classificationUrlParams({
		pageSize: 100,
		sort: "the server's order",
		storageKey: 'issue-rules-all-v3'
	}),
	issueState: facetParam(
		'State',
		'open | closed — the state of the rule’s issue',
		'rules'
	),
	...RULE_FACET_PARAMS,
	project: {
		codec: 'raw, repeatable',
		values: 'project id — only the first is read',
		whenAbsent: 'every project is listed, grouped by project',
		writtenBy: 'the sidebar project picker'
	}
} as const;

type IssueRulesUrlParam = keyof typeof ISSUE_RULES_URL_PARAMS;

const ISSUE_RULES_TABLE_IDS = {
	table: 'issue-rules-table',
	searchPlaceholder: 'Search test or issue',
	reset: 'issue-rules-reset-filters',
	row: 'issue-rule-row',
	rowIdAttribute: 'data-rule-id'
} as const;

class IssueRulesPage {
	private readonly url: UrlParams;
	readonly table: ClassificationTable;

	constructor(private readonly page: Page) {
		this.url = urlParams(page);
		this.table = new ClassificationTable(page, ISSUE_RULES_TABLE_IDS);
	}

	async goto(params: Record<string, string> = {}): Promise<void> {
		const search = new URLSearchParams(params).toString();

		await this.page.goto(`issues/rules${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(/\/issues\/rules(?:$|\?)/);
	}

	get root(): Locator {
		return this.page.getByTestId('issue-rules-list-page');
	}

	async expectReady(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await this.table.expectLoaded();
	}

	async expectEveryRowActive(active: boolean): Promise<void> {
		await this.table.expectEveryRowAttribute(
			'data-rule-active',
			String(active),
			`every listed rule is ${active ? 'active' : 'inactive'}`
		);
	}

	/** The Issue cell links to the issue the rule belongs to. */
	async openIssue(ruleId: number, issueTitle: string): Promise<void> {
		await this.table
			.row(ruleId)
			.getByRole('link', { name: issueTitle })
			.click();
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsAbsent(keys: readonly string[]): Promise<void> {
		await this.url.expectAbsent(keys);
	}
}

export {
	ISSUE_RULES_TABLE_IDS,
	ISSUE_RULES_URL_PARAMS,
	IssueRulesPage,
	RULE_FACET_PARAMS
};
export type { IssueRulesUrlParam };
