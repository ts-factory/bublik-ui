/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import type { IssueDrawer } from './pages/issue-drawer';
import { IssuePage } from './pages/issue-page';
import { IssuesPage } from './pages/issues-page';
import { IssueCleanup, NO_RUN_TAG } from './support/classification';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';
import { projectIdByName } from './support/e2e-data';
import { withAdminPage } from './support/session';
import { classifiableRun, classifiableTestPaths } from './support/sample-cases';
import type { ClassifiableTestPath } from './support/sample-cases';

const ISSUE_WRITE = { tag: ['@issues', '@issues-write'] };
const ISSUE_RULE = { tag: ['@issues', '@issues-write', '@needs-nok'] };

const cleanup = new IssueCleanup('issue');

function fixtureRun() {
	return requireCapability(
		classifiableRun(requireManifest()),
		'Fixture manifest contains no second NOK run safe to classify.'
	);
}

function failingTest(): ClassifiableTestPath {
	return requireCapability(
		classifiableTestPaths(fixtureRun())[0],
		'The classifiable run has no failing test with a verdict.'
	);
}

async function fixtureProjectId(request: APIRequestContext): Promise<number> {
	const name = fixtureRun().bundle.project;

	return requireCapability(
		await projectIdByName(request, name),
		`Project "${name}" is not registered.`
	);
}

interface RecordedIssue {
	title: string;
	issueId: number;
	projectId: number;
}

/** Records an issue on the issues page and lands on its own page. */
async function recordAndOpen(
	page: Page,
	request: APIRequestContext,
	label: string
): Promise<{ issuePage: IssuePage; issue: RecordedIssue }> {
	const projectId = await fixtureProjectId(request);
	const issuesPage = new IssuesPage(page);
	const title = cleanup.title(label);

	await issuesPage.goto({ project: String(projectId) });
	await issuesPage.expectLoaded();
	const issueId = await issuesPage.createIssue({ title });
	cleanup.register(issueId, projectId);
	await issuesPage.openIssue(title);

	const issuePage = new IssuePage(page);
	await issuePage.expectLoaded(title);
	await issuePage.expectRulesReady();

	return { issuePage, issue: { title, issueId, projectId } };
}

async function writeActiveRule(
	issuePage: IssuePage,
	failing: ClassifiableTestPath
): Promise<Locator> {
	const drawer = await issuePage.openNewRule();
	await drawer.pickTest(failing.testName, failing.pathStr);
	// Gated off every run, so the rule never stamps a run another scenario
	// applies its rules to.
	await drawer.addTags([NO_RUN_TAG]);
	await drawer.setCategory('Known');
	await drawer.setDisposition('Expected');
	await drawer.submit();
	await drawer.expectClosed();

	const row = issuePage.ruleRowByTest(failing.testName).first();
	await issuePage.expectRuleListed(row);

	return row;
}

async function removeIssue(
	issuePage: IssuePage,
	issue: RecordedIssue
): Promise<void> {
	await issuePage.deleteIssue(issue.title);
	cleanup.forget(issue.issueId);
}

test.describe('Issue Page', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await cleanup.sweep(request);
	});

	test(
		'The issue page shows the facts of a freshly recorded issue',
		{ tag: ['@issues', '@issues-write', '@smoke'] },
		async ({ page, request }) => {
			let issuePage!: IssuePage;
			let issue!: RecordedIssue;

			await given('I record an issue and open its page', async () => {
				({ issuePage, issue } = await recordAndOpen(page, request, 'facts'));
			});
			await then(
				"the page is headed by the issue's title and its open state",
				async () => {
					await expect(issuePage.heading).toHaveText(issue.title);
					await issuePage.expectState('open');
				}
			);
			await and(
				'the facts list the key, rules, created and updated times',
				async () => {
					await issuePage.expectFactsListed([
						'Key',
						'Rules',
						'Created',
						'Updated'
					]);
					await issuePage.expectNoClosedFact();
				}
			);
			await and('the rules badge says the issue has no rules', () =>
				issuePage.expectRulesState('unruled', 'No rules')
			);
			await and('the rules table says the issue has no rules yet', () =>
				issuePage.expectNoRulesYet()
			);
			await when('I delete the issue from its page', () =>
				removeIssue(issuePage, issue)
			);
			await then(
				'I am back on the issues page and the issue is gone',
				async () => {
					const issuesPage = new IssuesPage(page);
					await issuesPage.expectLoaded();
					await issuesPage.table.search(issue.title);
					await issuesPage.table.expectNoMatching();
				}
			);
		}
	);

	test(
		'A rule written from the issue page is locked to that issue',
		ISSUE_RULE,
		async ({ page, request }) => {
			const failing = failingTest();
			let issuePage!: IssuePage;
			let issue!: RecordedIssue;
			let row!: Locator;

			await given('I record an issue and open its page', async () => {
				({ issuePage, issue } = await recordAndOpen(page, request, 'rule'));
			});
			const drawer = await when('I open the New Rule drawer', () =>
				issuePage.openNewRule()
			);
			await then(
				'the issue is already picked and cannot be changed',
				async () => {
					await drawer.expectIssuePicked(issue.title);
					await drawer.expectIssueLocked();
				}
			);
			await when('I submit the rule without a test', () => drawer.submit());
			await then('I am told to select a test', () =>
				drawer.expectValidation('Select a test')
			);
			await when(
				'I pick a failing test of the fixture run and create the rule',
				async () => {
					await drawer.pickTest(failing.testName, failing.pathStr);
					// Gated off every run, so the rule never stamps a run another
					// scenario applies its rules to.
					await drawer.addTags([NO_RUN_TAG]);
					await drawer.setCategory('Known');
					await drawer.setDisposition('Expected');
					await drawer.submit();
					await drawer.expectClosed();
				}
			);
			await then('the rule is listed as active', async () => {
				row = issuePage.ruleRowByTest(failing.testName).first();
				await issuePage.expectRuleListed(row);
				await issuePage.expectRuleActive(row, true);
			});
			await and('the rules badge says one of one rules is active', () =>
				issuePage.expectRulesState('enforced', '1 of 1 rules active')
			);
			const edit = await when(
				'I edit the rule and make it inactive',
				async () => {
					const opened = await issuePage.editRule(row);
					await opened.setActive(false);

					return opened;
				}
			);
			await then('the rule is listed as inactive', async () => {
				await edit.submit();
				await edit.expectClosed();
				await issuePage.expectRuleActive(row, false);
			});
			await and('the test cannot be changed while editing', async () => {
				const reopened = await issuePage.editRule(row);
				await reopened.expectTestDisabled();
				await reopened.expectMatcherReadonly();
				await reopened.close();
			});
			await when('I delete the rule', () => issuePage.deleteRule(row));
			await then('the rules table says the issue has no rules yet', () =>
				issuePage.expectNoRulesYet()
			);
			await and('I delete the issue from its page', () =>
				removeIssue(issuePage, issue)
			);
		}
	);

	test(
		'Closing an issue deactivates its rules and reopening leaves them inactive',
		ISSUE_RULE,
		async ({ page, request }) => {
			const failing = failingTest();
			let issuePage!: IssuePage;
			let issue!: RecordedIssue;
			let row!: Locator;

			await given(
				'I record an issue with an active rule and open its page',
				async () => {
					({ issuePage, issue } = await recordAndOpen(page, request, 'close'));
					row = await writeActiveRule(issuePage, failing);
					await issuePage.expectRulesState('enforced', '1 of 1 rules active');
				}
			);
			await when('I close the issue', () => issuePage.close());
			await then(
				'the issue is closed and its closed time is listed',
				async () => {
					await issuePage.expectState('closed');
					await issuePage.expectFactsListed(['Closed']);
				}
			);
			await and('the rules badge says the rules were deactivated', () =>
				issuePage.expectRulesState('deactivated', '0 of 1 rules active')
			);
			await and('the rule is listed as inactive', () =>
				issuePage.expectRuleActive(row, false)
			);
			await when('I reopen the issue', () => issuePage.reopen());
			await then('the issue is open again', () =>
				issuePage.expectState('open')
			);
			await and('the rules badge says the issue has no active rules', () =>
				issuePage.expectRulesState('dormant', '0 of 1 rules active')
			);
			await and('the rule is still listed as inactive', () =>
				issuePage.expectRuleActive(row, false)
			);
			await and('I delete the issue from its page', () =>
				removeIssue(issuePage, issue)
			);
		}
	);

	test(
		'Editing from the issue page changes the description and state',
		ISSUE_WRITE,
		async ({ page, request }) => {
			let issuePage!: IssuePage;
			let issue!: RecordedIssue;
			const description = 'Reproduces on every run since the driver bump.';
			let drawer!: IssueDrawer;

			await given('I record an issue and open its page', async () => {
				({ issuePage, issue } = await recordAndOpen(page, request, 'edit'));
			});
			await when(
				'I edit the issue with a description and the closed state',
				async () => {
					drawer = await issuePage.openEdit();
					await drawer.expectStateFieldShown(true);
					await drawer.fill({ description, state: 'Closed' });
				}
			);
			await then(
				'the state field shows the closed badge and what closing does',
				() =>
					drawer.expectState(
						'closed',
						'Its rules are off, and their failures count again.'
					)
			);
			await when('I save the edit', async () => {
				await drawer.submit();
				await drawer.expectClosed();
			});
			await then('the description is shown beside the facts', () =>
				issuePage.expectDescription(description)
			);
			await and('the issue is closed', () => issuePage.expectState('closed'));
			await and('I delete the issue from its page', () =>
				removeIssue(issuePage, issue)
			);
		}
	);

	test(
		'An invalid issue id shows the no-data state',
		{ tag: ['@issues'] },
		async ({ page }) => {
			const issuePage = new IssuePage(page);

			await when('I open the issue page with an id that is not a number', () =>
				issuePage.goto('not-a-number')
			);
			await then('I am told the issue id is missing or invalid', () =>
				issuePage.expectInvalidId()
			);
		}
	);
});

test.describe('Issue Page (signed out)', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test(
		'Issue actions while signed out point to signing in',
		{ tag: ['@issues', '@auth'] },
		async ({ page, browser, playwright, baseURL }) => {
			const issuePage = new IssuePage(page);
			const dialog = page.getByTestId('login-dialog');
			const base = requireCapability(baseURL, 'BASE_URL is not set.');
			const title = cleanup.title('guards');
			let projectId = 0;
			let issueId = 0;

			await given('an issue was recorded by a signed-in session', async () => {
				await withAdminPage(browser, playwright, base, async (adminPage) => {
					const issuesPage = new IssuesPage(adminPage);
					projectId = await fixtureProjectId(adminPage.request);
					await issuesPage.goto({ project: String(projectId) });
					await issuesPage.expectLoaded();
					issueId = await issuesPage.createIssue({ title });
				});
			});
			await and("I am signed out and open that issue's page", async () => {
				const sessionChecked = page.waitForResponse(
					(response) =>
						response.url().includes('/auth/profile/info/') &&
						response.status() === 403
				);
				await issuePage.goto(issueId, { project: String(projectId) });
				await sessionChecked;
				await issuePage.expectLoaded(title);
				await issuePage.expectRulesReady();
			});
			await then(
				'closing, editing and deleting the issue and writing rules are disabled with hints to log in',
				async () => {
					for (const message of [
						'Log in to close or reopen issues',
						'Log in to edit issues',
						'Log in to delete issues',
						'Log in to create rules'
					]) {
						await expect(
							issuePage.loginRequiredAction(message).first()
						).toBeVisible({ timeout: 30_000 });
					}
				}
			);
			await when('I click the close action anyway', () =>
				issuePage
					.loginRequiredAction('Log in to close or reopen issues')
					.click()
			);
			await then(
				'I am asked to sign in to close or reopen issues',
				async () => {
					await expect(
						dialog.getByText('Log in to close or reopen issues.')
					).toBeVisible({ timeout: 15_000 });
					await expect(
						dialog.getByRole('button', { name: 'Sign in' })
					).toBeVisible();
				}
			);
			await when('I close the sign-in dialog', () =>
				page.keyboard.press('Escape')
			);
			await then('the sign-in dialog is closed', () =>
				expect(dialog).toHaveCount(0, { timeout: 15_000 })
			);
			await and('the signed-in session deletes that issue', () =>
				withAdminPage(browser, playwright, base, async (adminPage) => {
					const issuesPage = new IssuesPage(adminPage);
					await issuesPage.goto({ project: String(projectId) });
					await issuesPage.expectLoaded();
					await issuesPage.table.search(title);
					await issuesPage.deleteIssue(title);
				})
			);
		}
	);
});
