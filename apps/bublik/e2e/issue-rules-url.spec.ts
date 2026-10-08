/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

import { IssuePage } from './pages/issue-url-page';
import { IssueRulesPage } from './pages/issue-rules-url-page';
import {
	CATEGORY_LABELS,
	issueWithRules,
	richestProject,
	seededRuleIds
} from './support/classification-data';
import { requireCapability } from './support/capabilities';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import { SIDEBAR_ALIASES, sidebarState } from './support/sidebar-state';

const TAG = { tag: ['@issues', '@needs-classification'] };
const URL_TAG = {
	tag: ['@issues', '@needs-classification', '@url-params']
};

async function openRichestProject(
	page: Page,
	params: Record<string, string> = {}
): Promise<{ rulesPage: IssueRulesPage; projectId: string }> {
	const rulesPage = new IssueRulesPage(page);
	const projectId = String(richestProject(requireManifest()).projectId);

	await rulesPage.goto({ project: projectId, ...params });
	await rulesPage.expectReady();

	return { rulesPage, projectId };
}

test.describe('Issue rules', () => {
	test(
		'The rules list shows the seeded rules grouped by project',
		{ tag: ['@issues', '@needs-classification', '@smoke'] },
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const issue = issueWithRules(requireManifest());
			const ruleIds = seededRuleIds(issue);

			await given('the fixture manifest seeds rules for an issue', () =>
				expect(ruleIds.length).toBeGreaterThan(0)
			);
			await when('I open the rules list for every project', () =>
				rulesPage.goto()
			);
			await then("the issue's project heads a group of rules", () =>
				rulesPage.table.expectGroupedBy([issue.projectName])
			);
			await and("the issue's rules are listed", async () => {
				for (const ruleId of ruleIds) {
					await rulesPage.table.expectRowListed(ruleId);
				}
			});
		}
	);

	test("A rule's issue opens the issue page", TAG, async ({ page }) => {
		const issuePage = new IssuePage(page);
		const issue = issueWithRules(requireManifest());
		const ruleId = requireCapability(
			seededRuleIds(issue)[0],
			`Issue ${issue.issueId} has no seeded rule id.`
		);
		let rulesPage: IssueRulesPage;

		await given('the rules list shows a seeded rule', async () => {
			rulesPage = (
				await openRichestProject(page, { project: String(issue.projectId) })
			).rulesPage;
			await rulesPage.table.expectRowListed(ruleId);
		});
		await when("I follow the rule's issue", () =>
			rulesPage.openIssue(ruleId, issue.title)
		);
		await then("that issue's page is open", async () => {
			await expect(page).toHaveURL(
				new RegExp(`/issues/${issue.issueId}(?:$|[?#])`),
				{ timeout: 15_000 }
			);
			await issuePage.expectLoaded(issue.title);
		});
	});

	test(
		'Narrowing the rules to the active ones records the facet',
		URL_TAG,
		async ({ page }) => {
			let rulesPage: IssueRulesPage;

			await given('the rules list is open', async () => {
				rulesPage = (await openRichestProject(page)).rulesPage;
			});
			await when('I narrow the list to active rules', () =>
				rulesPage.table.toggleFacetOption('Rule', 'Active')
			);
			await then('the URL records the active facet', () =>
				rulesPage.expectParams({ active: 'true', page: null })
			);
			await and('every listed rule is active', () =>
				rulesPage.expectEveryRowActive(true)
			);
			await when('I reset the filters', () => rulesPage.table.reset());
			await then('the facet is dropped from the URL', () =>
				rulesPage.expectParams({ active: null })
			);
		}
	);

	test(
		'Sorting the rules by test records the sort',
		URL_TAG,
		async ({ page }) => {
			let rulesPage: IssueRulesPage;

			await given('the rules list is open', async () => {
				rulesPage = (await openRichestProject(page)).rulesPage;
			});
			await then("the URL carries no sort for the server's order", () =>
				rulesPage.expectParams({ sort: null })
			);
			await when('I sort by the Test column', () =>
				rulesPage.table.sortBy('Test')
			);
			await then('the URL records the ascending test sort', () =>
				rulesPage.expectParams({ sort: 'test:asc' })
			);
		}
	);

	test(
		'Showing a matcher column records it as shown',
		URL_TAG,
		async ({ page }) => {
			let rulesPage: IssueRulesPage;

			await given('the rules list is open', async () => {
				rulesPage = (await openRichestProject(page)).rulesPage;
				await rulesPage.table.expectHeaderHidden('Tags');
			});
			await when('I show the Tags column', () =>
				rulesPage.table.toggleColumn('Tags')
			);
			await then('the URL records the Tags column as shown', () =>
				rulesPage.expectParams({ cols: '+tags' })
			);
			await and('the Tags column is present', () =>
				rulesPage.table.expectHeaderShown('Tags')
			);
			await when('I hide the Tags column', () =>
				rulesPage.table.toggleColumn('Tags')
			);
			await then('the column override is dropped from the URL', async () => {
				await rulesPage.expectParams({ cols: null });
				await rulesPage.table.expectHeaderHidden('Tags');
			});
		}
	);

	test(
		'A rules link restores the search, the facets and the page size',
		URL_TAG,
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const issue = issueWithRules(requireManifest());
			// The link narrows to active rules of its category: one must exist
			const activeRule = requireCapability(
				issue.rules.find((rule) => rule.active),
				`Issue ${issue.issueId} has no active seeded rule.`
			);
			const link = {
				project: String(issue.projectId),
				q: issue.title,
				active: 'true',
				category: activeRule.category,
				pageSize: '10'
			};

			await given(
				'a link that pins a search term, the active facet, a category and a page size',
				() => expect(Object.keys(link)).toHaveLength(5)
			);
			await when('I open that link', async () => {
				await rulesPage.goto(link);
				await rulesPage.expectReady();
			});
			await then('the list is narrowed as the link says', async () => {
				await expect(rulesPage.table.searchInput).toHaveValue(issue.title);
				await rulesPage.table.expectFacetSelected('Rule', 'Active');
				await rulesPage.table.expectFacetSelected(
					'Category',
					CATEGORY_LABELS[activeRule.category]
				);
				await rulesPage.expectEveryRowActive(true);
				await rulesPage.table.expectRowCountAtMost(10);
			});
			await and(
				'the link still carries every parameter it was opened with',
				() => rulesPage.expectParams(link)
			);
		}
	);

	test(
		"The sidebar's Rules link returns to the last rules list address",
		URL_TAG,
		async ({ page }) => {
			const sidebar = sidebarState(page);

			await given('the rules list is open with the active facet', async () => {
				const { rulesPage } = await openRichestProject(page, {
					active: 'true'
				});
				await rulesPage.expectEveryRowActive(true);
			});
			await when('I move to the dashboard', async () => {
				await page
					.getByRole('link', { name: 'Dashboard', exact: true })
					.click();
				await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
			});
			await then(
				'the compressed sidebar state remembers the filtered rules list',
				() =>
					sidebar.expectAliasCarries(
						SIDEBAR_ALIASES.issuesLastRules,
						'active=true'
					)
			);
		}
	);
});
