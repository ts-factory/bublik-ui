/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { UrlParams, urlParams } from '../support/url-params';
import {
	ClassificationTable,
	classificationUrlParams
} from './classification-table-url';
import {
	ISSUE_RULES_TABLE_IDS,
	RULE_FACET_PARAMS
} from './issue-rules-url-page';

/**
 * One issue's rules table: the same codec as the all-rules page, with its own
 * localStorage key and without the Issue, Key and State columns — one issue's
 * rules are one issue's.
 */
const ISSUE_URL_PARAMS = {
	...classificationUrlParams({
		pageSize: 100,
		sort: "the server's order",
		storageKey: 'issue-rules-v3'
	}),
	...RULE_FACET_PARAMS,
	project: {
		codec: 'raw, repeatable',
		values: 'project id — only the first is read',
		whenAbsent: 'the issue is looked up without a project scope',
		writtenBy: 'the sidebar project picker'
	}
} as const;

type IssueUrlParam = keyof typeof ISSUE_URL_PARAMS;

class IssuePage {
	private readonly url: UrlParams;
	readonly rules: ClassificationTable;

	constructor(private readonly page: Page) {
		this.url = urlParams(page);
		this.rules = new ClassificationTable(page, {
			...ISSUE_RULES_TABLE_IDS,
			searchPlaceholder: 'Search test'
		});
	}

	async goto(
		issueId: number | string,
		params: Record<string, string> = {}
	): Promise<void> {
		const search = new URLSearchParams(params).toString();

		await this.page.goto(`issues/${issueId}${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(
			new RegExp(`/issues/${issueId}(?:$|[?#])`)
		);
	}

	get root(): Locator {
		return this.page.getByTestId('issue-page');
	}

	async expectLoaded(title: string): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await expect(
			this.page.getByRole('heading', { level: 1, name: title })
		).toBeVisible({ timeout: 30_000 });
	}

	async expectNotFound(issueId: string): Promise<void> {
		await expect(this.page).toHaveURL(new RegExp(`/issues/${issueId}$`));
		await expect(this.page.getByText(/not found/i).first()).toBeVisible({
			timeout: 15_000
		});
		await expect(this.page.locator('#sidebar')).toBeVisible();
		await expect(this.root).toHaveCount(0);
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsAbsent(keys: readonly string[]): Promise<void> {
		await this.url.expectAbsent(keys);
	}
}

export { ISSUE_URL_PARAMS, IssuePage };
export type { IssueUrlParam };
