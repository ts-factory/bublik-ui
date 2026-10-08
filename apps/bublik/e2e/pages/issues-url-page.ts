/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { UrlParams, urlParams } from '../support/url-params';
import {
	ClassificationTable,
	classificationUrlParams,
	facetParam
} from './classification-table-url';

const ISSUES_URL_PARAMS = {
	...classificationUrlParams({
		pageSize: 100,
		sort: 'created:desc',
		storageKey: 'issues-v2'
	}),
	state: facetParam('State', 'open | closed', 'issues'),
	categories: facetParam(
		'Category',
		'product-defect | test-bug | env | known-issue | flaky | to-investigate — the categories of an issue’s rules',
		'issues'
	),
	rules: facetParam(
		'Rules',
		'enforced | dormant | deactivated — whether the issue has active rules',
		'issues'
	),
	project: {
		codec: 'raw, repeatable',
		values: 'project id — only the first is read',
		whenAbsent: 'every project is listed, grouped by project',
		writtenBy: 'the sidebar project picker'
	}
} as const;

type IssuesUrlParam = keyof typeof ISSUES_URL_PARAMS;

class IssuesPage {
	private readonly url: UrlParams;
	readonly table: ClassificationTable;

	constructor(private readonly page: Page) {
		this.url = urlParams(page);
		this.table = new ClassificationTable(page, {
			table: 'issues-table',
			searchPlaceholder: 'Search title, description or key',
			reset: 'issues-reset-filters',
			row: 'issue-row',
			rowIdAttribute: 'data-issue-id'
		});
	}

	async goto(params: Record<string, string> = {}): Promise<void> {
		const search = new URLSearchParams(params).toString();

		await this.page.goto(`issues${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(/\/issues(?:$|\?)/);
	}

	get root(): Locator {
		return this.page.getByTestId('issues-page');
	}

	async expectReady(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await this.table.expectLoaded();
	}

	issueLink(issueId: number): Locator {
		return this.table.row(issueId).getByRole('link').first();
	}

	async openIssue(issueId: number): Promise<void> {
		await this.issueLink(issueId).click();
		await expect(this.page).toHaveURL(
			new RegExp(`/issues/${issueId}(?:$|[?#])`),
			{ timeout: 15_000 }
		);
	}

	async expectEveryRowInState(state: string): Promise<void> {
		await this.table.expectEveryRowAttribute(
			'data-issue-state',
			state,
			`every listed issue is ${state}`
		);
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsAbsent(keys: readonly string[]): Promise<void> {
		await this.url.expectAbsent(keys);
	}
}

export { ISSUES_URL_PARAMS, IssuesPage };
export type { IssuesUrlParam };
