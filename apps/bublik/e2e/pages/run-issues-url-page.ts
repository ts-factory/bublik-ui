/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { QUERY_DELIMITER, UrlParams, urlParams } from '../support/url-params';
import {
	ClassificationTable,
	classificationUrlParams,
	facetParam
} from './classification-table-url';

const RUN_ISSUES_URL_PARAMS = {
	...classificationUrlParams({
		pageSize: 25,
		sort: "the server's order",
		storageKey: 'run-issues'
	}),
	open: {
		codec: `raw, \`${QUERY_DELIMITER}\`-joined issue ids`,
		values: 'the issues whose results panel is unfolded',
		whenAbsent: 'every panel is folded',
		writtenBy:
			'the Results count badge; an issue missing from the page is simply not unfolded'
	},
	state: facetParam('State', 'open | closed', 'issues'),
	effect: facetParam(
		'Effect On Run',
		'suppressed | stale | unexpected | marked',
		'issues'
	),
	categories: facetParam(
		'Category',
		'product-defect | test-bug | env | known-issue | flaky | to-investigate — the categories of the issue’s rules',
		'issues'
	),
	project: {
		codec: 'raw, repeatable',
		values:
			'project id — read by the links, not by the table, which uses the run’s own project',
		whenAbsent: 'the run’s project',
		writtenBy: 'the sidebar project picker'
	}
} as const;

type RunIssuesUrlParam = keyof typeof RUN_ISSUES_URL_PARAMS;

class RunIssuesPage {
	private readonly url: UrlParams;
	readonly table: ClassificationTable;

	constructor(private readonly page: Page) {
		this.url = urlParams(page);
		this.table = new ClassificationTable(page, {
			table: 'run-issues-table',
			searchPlaceholder: 'Search title or key',
			reset: 'run-issues-reset-filters',
			row: 'run-issue-row',
			rowIdAttribute: 'data-issue-id'
		});
	}

	async goto(
		runId: number,
		params: Record<string, string> = {}
	): Promise<void> {
		const search = new URLSearchParams(params).toString();

		await this.page.goto(`runs/${runId}/issues${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(
			new RegExp(`/runs/${runId}/issues(?:$|\\?)`)
		);
	}

	get root(): Locator {
		return this.page.getByTestId('run-issues-page');
	}

	async expectReady(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await this.table.expectLoaded();
	}

	resultCountBadge(issueId: number): Locator {
		return this.table.row(issueId).getByTestId('run-issue-result-count');
	}

	async toggleResults(issueId: number): Promise<void> {
		await this.resultCountBadge(issueId).click();
	}

	async expectResultsOpen(issueId: number): Promise<void> {
		await expect(this.resultCountBadge(issueId)).toHaveAttribute(
			'aria-expanded',
			'true',
			{ timeout: 15_000 }
		);
		await expect(this.page.getByTestId('issue-results').first()).toBeVisible({
			timeout: 30_000
		});
	}

	async expectResultsClosed(issueId: number): Promise<void> {
		await expect(this.resultCountBadge(issueId)).toHaveAttribute(
			'aria-expanded',
			'false',
			{ timeout: 15_000 }
		);
	}

	headerLink(name: 'Run' | 'Log'): Locator {
		return this.root.getByRole('link', { name, exact: true });
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsAbsent(keys: readonly string[]): Promise<void> {
		await this.url.expectAbsent(keys);
	}
}

export { RUN_ISSUES_URL_PARAMS, RunIssuesPage };
export type { RunIssuesUrlParam };
