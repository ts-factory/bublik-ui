/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

import { RunIssuesPage } from './pages/run-issues-url-page';
import {
	CATEGORY_LABELS,
	richestClassifiedRun
} from './support/classification-data';
import type { ClassifiedRunCase } from './support/classification-data';
import type { SeededRule } from './support/seeded-classification';
import { requireCapability } from './support/capabilities';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';

const URL_TAG = {
	tag: ['@issues', '@needs-classification', '@url-params']
};

async function openClassifiedRun(
	page: Page,
	params: Record<string, string> = {}
): Promise<{ runIssuesPage: RunIssuesPage; runCase: ClassifiedRunCase }> {
	const runIssuesPage = new RunIssuesPage(page);
	const runCase = richestClassifiedRun(requireManifest());

	await runIssuesPage.goto(runCase.runId, params);
	await runIssuesPage.expectReady();

	return { runIssuesPage, runCase };
}

test.describe('Run issues', () => {
	test(
		"A run's issues page lists the issues its results were classified with",
		{ tag: ['@issues', '@needs-classification', '@smoke'] },
		async ({ page }) => {
			const runIssuesPage = new RunIssuesPage(page);
			const runCase = richestClassifiedRun(requireManifest());

			await given(
				'the fixture manifest describes a run with classified results',
				() => expect(runCase.issues.length).toBeGreaterThan(0)
			);
			await when("I open that run's issues page", () =>
				runIssuesPage.goto(runCase.runId)
			);
			await then('each seeded issue of that run is listed', async () => {
				await runIssuesPage.expectReady();
				for (const issue of runCase.issues) {
					await runIssuesPage.table.expectRowListed(issue.issueId);
				}
			});
			await and('the header links to the run and its log', async () => {
				await expect(runIssuesPage.headerLink('Run')).toHaveAttribute(
					'href',
					new RegExp(`/runs/${runCase.runId}(?:$|[?#])`)
				);
				await expect(runIssuesPage.headerLink('Log')).toHaveAttribute(
					'href',
					new RegExp(`/log/${runCase.runId}(?:$|[?#])`)
				);
			});
		}
	);

	test(
		"Unfolding an issue's results records it in the URL and survives a reload",
		URL_TAG,
		async ({ page }) => {
			let runIssuesPage: RunIssuesPage;
			let issueId = 0;

			await given("a run's issues page is open", async () => {
				const opened = await openClassifiedRun(page);

				runIssuesPage = opened.runIssuesPage;
				issueId = opened.runCase.issues[0].issueId;
				await runIssuesPage.expectParams({ open: null });
			});
			await when('I unfold the results of a seeded issue', () =>
				runIssuesPage.toggleResults(issueId)
			);
			await then('the URL records that issue as open', () =>
				runIssuesPage.expectParams({ open: String(issueId) })
			);
			await and('its results are shown', () =>
				runIssuesPage.expectResultsOpen(issueId)
			);
			await when('I reload the page', async () => {
				await page.reload();
				await runIssuesPage.expectReady();
			});
			await then('its results are still shown', () =>
				runIssuesPage.expectResultsOpen(issueId)
			);
			await when('I fold the results again', () =>
				runIssuesPage.toggleResults(issueId)
			);
			await then('the open key is dropped from the URL', async () => {
				await runIssuesPage.expectParams({ open: null });
				await runIssuesPage.expectResultsClosed(issueId);
			});
		}
	);

	test(
		"Narrowing a run's issues by category records the facet",
		URL_TAG,
		async ({ page }) => {
			let runIssuesPage: RunIssuesPage;
			let category: SeededRule['category'];

			await given("a run's issues page is open", async () => {
				const opened = await openClassifiedRun(page);

				runIssuesPage = opened.runIssuesPage;
				category = requireCapability(
					opened.runCase.categories[0],
					`Run ${opened.runCase.runId} was classified by rules without a category.`
				);
			});
			await when('I narrow the list to a category its rules use', () =>
				runIssuesPage.table.toggleFacetOption(
					'Category',
					CATEGORY_LABELS[category]
				)
			);
			await then('the URL records that category', () =>
				runIssuesPage.expectParams({ categories: category, page: null })
			);
			await when('I reset the filters', () => runIssuesPage.table.reset());
			await then('the category is dropped from the URL', () =>
				runIssuesPage.expectParams({ categories: null })
			);
		}
	);

	test(
		"A run's issues page at twenty-five rows writes no page size",
		URL_TAG,
		async ({ page }) => {
			let runIssuesPage: RunIssuesPage;

			await given("a run's issues page is open", async () => {
				runIssuesPage = (await openClassifiedRun(page)).runIssuesPage;
			});
			await then('the URL carries no page size', () =>
				runIssuesPage.expectParams({ pageSize: null })
			);
			await when('I show ten issues per page', () =>
				runIssuesPage.table.setPageSize(10)
			);
			await then('the URL records ten rows per page', () =>
				runIssuesPage.expectParams({ pageSize: '10', page: null })
			);
			await and('at most ten issues are listed', () =>
				runIssuesPage.table.expectRowCountAtMost(10)
			);
		}
	);

	test(
		'A run issues link restores the open issue, the search and the sort',
		URL_TAG,
		async ({ page }) => {
			const runIssuesPage = new RunIssuesPage(page);
			const runCase = richestClassifiedRun(requireManifest());
			const issue = runCase.issues[0];
			const link = {
				open: String(issue.issueId),
				q: issue.title,
				sort: 'issue:asc'
			};

			await given(
				'a link that pins an open issue, its title as the search term and the issue sort',
				() => expect(Object.keys(link)).toHaveLength(3)
			);
			await when('I open that link', async () => {
				await runIssuesPage.goto(runCase.runId, link);
				await runIssuesPage.expectReady();
			});
			await then("the issue's results are shown", () =>
				runIssuesPage.expectResultsOpen(issue.issueId)
			);
			await and(
				'the list is narrowed and sorted as the link says',
				async () => {
					await expect(runIssuesPage.table.searchInput).toHaveValue(
						issue.title
					);
					await runIssuesPage.table.expectRowListed(issue.issueId);
					await runIssuesPage.table.expectSortedBy('Issue');
				}
			);
			await and(
				'the link still carries every parameter it was opened with',
				() => runIssuesPage.expectParams(link)
			);
		}
	);
});
