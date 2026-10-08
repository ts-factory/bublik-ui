/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';

import { DashboardPage } from './pages/dashboard-page';
import { IssuePage } from './pages/issue-url-page';
import { IssueRulesPage } from './pages/issue-rules-url-page';
import { IssuesPage } from './pages/issues-url-page';
import { LogPage } from './pages/log-page';
import { requireCapability } from './support/capabilities';
import { issueWithRules, richestProject } from './support/classification-data';
import { firstResultNode, representativeImportedRun } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import {
	encodeSidebarState,
	SIDEBAR_ALIASES,
	SIDEBAR_STATE_PARAM,
	sidebarState
} from './support/sidebar-state';
import { urlParams } from './support/url-params';

/** A history search the sidebar remembers, to check the redirect keeps `_s`. */
const HISTORY_SEARCH = 'testName=legacy-admin-redirect';

const LOG_TAG = { tag: ['@log', '@url-params'] };
const ISSUES_TAG = {
	tag: ['@issues', '@needs-classification', '@url-params']
};

test.describe('Legacy log address', () => {
	test(
		'A two-segment log address opens the run log in the full layout',
		LOG_TAG,
		async ({ page }) => {
			const logPage = new LogPage(page);
			const runCase = representativeImportedRun(requireManifest());
			const legacy = `log/${runCase.runId}/legacy-segment`;

			await given('a legacy two-segment log address for an imported run', () =>
				expect(legacy).toContain(`/${runCase.runId}/`)
			);
			await when('I open that address', () => page.goto(legacy));
			await then("the run's log is open in the full layout", async () => {
				await expect(page).toHaveURL(new RegExp(`/log/${runCase.runId}\\?`), {
					timeout: 30_000
				});
				await logPage.expectLoaded();
				await logPage.expectModeLayout('treeAndinfoAndlog');
			});
			await and('the URL records the full layout', () =>
				logPage.expectParams({ mode: 'treeAndinfoAndlog' })
			);
		}
	);

	test(
		'A two-segment log address keeps the focused result it carried',
		LOG_TAG,
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const runCase = representativeImportedRun(requireManifest());
			const result = requireCapability(
				await firstResultNode(request, runCase),
				`Run ${runCase.runId} has no test result in its tree.`
			);
			const legacy = `log/${runCase.runId}/legacy-segment?focusId=${result.node.id}`;

			await given(
				'a legacy two-segment log address that focuses a result',
				() => expect(legacy).toContain('focusId=')
			);
			await when('I open that address', () => page.goto(legacy));
			await then("the run's log is open in the full layout", async () => {
				await expect(page).toHaveURL(new RegExp(`/log/${runCase.runId}\\?`), {
					timeout: 30_000
				});
				await logPage.expectLoaded();
				await logPage.expectModeLayout('treeAndinfoAndlog');
			});
			await and('the URL still focuses that result', () =>
				logPage.expectParams({
					focusId: String(result.node.id),
					mode: 'treeAndinfoAndlog'
				})
			);
		}
	);
});

test.describe('Legacy admin issues addresses', () => {
	test(
		'The legacy issues address opens the issues list with its search and hash',
		ISSUES_TAG,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			const projectId = String(richestProject(requireManifest()).projectId);
			const sidebarMemory = encodeSidebarState({
				[SIDEBAR_ALIASES.historyLastLinear]: HISTORY_SEARCH
			});
			const legacy = `admin/issues?project=${projectId}&${SIDEBAR_STATE_PARAM}=${sidebarMemory}#top`;

			await given(
				'a legacy admin issues link scoped to a project with sidebar memory and an anchor',
				() => expect(legacy).toContain('#top')
			);
			await when('I open that link', () => page.goto(legacy));
			await then('the issues list is open', async () => {
				await expect(page).toHaveURL(/\/issues\?/, { timeout: 30_000 });
				await issuesPage.expectReady();
			});
			await and(
				'the URL still carries the project, the sidebar memory and the anchor',
				async () => {
					await issuesPage.expectParams({ project: projectId });
					await sidebarState(page).expectAliasCarries(
						SIDEBAR_ALIASES.historyLastLinear,
						HISTORY_SEARCH
					);
					expect(new URL(page.url()).hash).toBe('#top');
				}
			);
		}
	);

	test(
		'The legacy rules address opens the rules list with its filters',
		ISSUES_TAG,
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const projectId = String(richestProject(requireManifest()).projectId);
			const legacy = `admin/issues/rules?project=${projectId}&active=true`;

			await given('a legacy admin rules link with the active facet', () =>
				expect(legacy).toContain('active=true')
			);
			await when('I open that link', () => page.goto(legacy));
			await then('the rules list is open', async () => {
				await expect(page).toHaveURL(/\/issues\/rules\?/, {
					timeout: 30_000
				});
				await rulesPage.expectReady();
			});
			await and('the URL still carries the facet', () =>
				rulesPage.expectParams({ active: 'true', project: projectId })
			);
		}
	);

	test(
		'The legacy issue address opens that issue',
		ISSUES_TAG,
		async ({ page }) => {
			const issuePage = new IssuePage(page);
			const issue = issueWithRules(requireManifest());
			const legacy = `admin/issues/${issue.issueId}`;

			await given('a legacy admin link to a seeded issue', () =>
				expect(legacy).toContain(String(issue.issueId))
			);
			await when('I open that link', () => page.goto(legacy));
			await then("that issue's page is open", async () => {
				await expect(page).toHaveURL(
					new RegExp(`/issues/${issue.issueId}(?:$|[?#])`),
					{ timeout: 30_000 }
				);
				await issuePage.expectLoaded(issue.title);
			});
		}
	);

	test(
		'A legacy admin issues address is replaced rather than kept in history',
		// Reads no seeded data
		{ tag: ['@issues', '@url-params'] },
		async ({ page }) => {
			const dashboardPage = new DashboardPage(page);
			const issuesPage = new IssuesPage(page);
			const url = urlParams(page);

			await given('I open the dashboard', () => dashboardPage.goto());
			await when('I open a legacy admin issues link', () =>
				page.goto('admin/issues')
			);
			await then('the issues list is open', async () => {
				await expect(page).toHaveURL(/\/issues(?:$|\?)/, { timeout: 30_000 });
				await issuesPage.expectReady();
				expect(url.get('project')).toBeNull();
			});
			await when('I go back', () => page.goBack());
			await then('the dashboard is open again', () =>
				expect(page).toHaveURL(/\/dashboard(?:$|\?)/, { timeout: 15_000 })
			);
		}
	);
});
