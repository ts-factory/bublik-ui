/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

import { IssuePage } from './pages/issue-url-page';
import { IssueRulesPage } from './pages/issue-rules-url-page';
import {
	issueWithRules,
	seededRuleIds,
	testOfRule
} from './support/classification-data';
import type { SeededIssue } from './support/classification-data';
import { requireCapability } from './support/capabilities';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';

const URL_TAG = {
	tag: ['@issues', '@needs-classification', '@url-params']
};

async function openSeededIssue(
	page: Page
): Promise<{ issuePage: IssuePage; issue: SeededIssue }> {
	const issuePage = new IssuePage(page);
	const issue = issueWithRules(requireManifest());

	await issuePage.goto(issue.issueId);
	await issuePage.expectLoaded(issue.title);
	await issuePage.rules.expectLoaded();

	return { issuePage, issue };
}

test.describe('Issue', () => {
	test(
		'An issue page shows the issue and its rules',
		{ tag: ['@issues', '@needs-classification', '@smoke'] },
		async ({ page }) => {
			const issuePage = new IssuePage(page);
			const issue = issueWithRules(requireManifest());
			const ruleIds = seededRuleIds(issue);

			await given('the fixture manifest seeds an open issue with rules', () =>
				expect(ruleIds.length).toBeGreaterThan(0)
			);
			await when("I open that issue's page", () =>
				issuePage.goto(issue.issueId)
			);
			await then("the issue's title is shown", () =>
				issuePage.expectLoaded(issue.title)
			);
			await and('each of its rules is listed', async () => {
				for (const ruleId of ruleIds) {
					await issuePage.rules.expectRowListed(ruleId);
				}
			});
		}
	);

	test(
		'An issue address that is not a number shows the not-found page',
		// Reads no seeded data: the route rejects the id before any request
		{ tag: ['@issues'] },
		async ({ page }) => {
			const issuePage = new IssuePage(page);

			await when(
				'I open the issues address with a word in place of the id',
				() => issuePage.goto('latest')
			);
			await then(
				'the not-found page is shown inside the app shell at that address',
				() => issuePage.expectNotFound('latest')
			);
		}
	);

	test(
		"Searching an issue's rules records the term",
		URL_TAG,
		async ({ page }) => {
			const manifest = requireManifest();
			let issuePage: IssuePage;
			let ruleId = 0;
			let testName = '';

			await given("an issue's page is open", async () => {
				const opened = await openSeededIssue(page);
				const rule = requireCapability(
					opened.issue.rules[0],
					`Issue ${opened.issue.issueId} has no seeded rule.`
				);

				issuePage = opened.issuePage;
				ruleId = rule.ruleId;
				testName = testOfRule(manifest, rule);
			});
			await when('I search its rules for the test of one of them', () =>
				issuePage.rules.search(testName)
			);
			await then('the URL records the term', () =>
				issuePage.expectParams({ q: testName, page: null })
			);
			await and('that rule is still listed', () =>
				issuePage.rules.expectRowListed(ruleId)
			);
		}
	);

	test(
		"Hiding a column on an issue's rules does not hide it on the rules list",
		URL_TAG,
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			let issuePage: IssuePage;
			let projectId = 0;

			await given("an issue's page is open", async () => {
				const opened = await openSeededIssue(page);

				issuePage = opened.issuePage;
				projectId = opened.issue.projectId;
				await issuePage.rules.expectHeaderShown('Test');
			});
			await when('I hide the Test column', () =>
				issuePage.rules.toggleColumn('Test')
			);
			await then('the URL records the Test column as hidden', () =>
				issuePage.expectParams({ cols: '-test' })
			);
			await and('the Test column is gone', () =>
				issuePage.rules.expectHeaderHidden('Test')
			);
			await when('I open the rules list', async () => {
				await rulesPage.goto({ project: String(projectId) });
				await rulesPage.expectReady();
			});
			await then('the Test column is shown there', async () => {
				await rulesPage.expectParams({ cols: null });
				await rulesPage.table.expectHeaderShown('Test');
			});
		}
	);

	test('An issue link keeps the project scope', URL_TAG, async ({ page }) => {
		const issuePage = new IssuePage(page);
		const issue = issueWithRules(requireManifest());
		const link = { project: String(issue.projectId) };

		await given('a link to a seeded issue scoped to its project', () =>
			expect(link.project).not.toBe('')
		);
		await when('I open that link', () => issuePage.goto(issue.issueId, link));
		await then("the issue's title is shown", () =>
			issuePage.expectLoaded(issue.title)
		);
		await and('the link still carries the project', () =>
			issuePage.expectParams(link)
		);
	});
});
