/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import { IssuePage } from './pages/issue-page';
import { IssueRulesPage } from './pages/issue-rules-page';
import { IssuesPage } from './pages/issues-page';
import type { RuleDrawer } from './pages/rule-drawer';
import { IssueCleanup, NO_RUN_TAG } from './support/classification';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { requireManifest } from './support/manifest';
import { projectIdByName } from './support/e2e-data';
import { classifiableRun, classifiableTestPaths } from './support/sample-cases';
import type { ClassifiableTestPath } from './support/sample-cases';

const RULES_WRITE = { tag: ['@issues', '@issues-write', '@needs-nok'] };
const RULES_WRITE_URL = {
	tag: ['@issues', '@issues-write', '@needs-nok', '@url-params']
};

const cleanup = new IssueCleanup('rules');

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

async function recordIssue(
	page: Page,
	request: APIRequestContext,
	label: string
): Promise<RecordedIssue> {
	const projectId = await fixtureProjectId(request);
	const issuesPage = new IssuesPage(page);
	const title = cleanup.title(label);

	await issuesPage.goto({ project: String(projectId) });
	await issuesPage.expectLoaded();
	const issueId = await issuesPage.createIssue({ title });
	cleanup.register(issueId, projectId);

	return { title, issueId, projectId };
}

/**
 * Records an issue and, from its page, an expected Known rule for `failing`,
 * gated off every run.
 */
async function recordIssueWithRule(
	page: Page,
	request: APIRequestContext,
	label: string,
	failing: ClassifiableTestPath,
	verdicts: string[] = []
): Promise<RecordedIssue> {
	const issue = await recordIssue(page, request, label);
	const issuePage = new IssuePage(page);

	await issuePage.goto(issue.issueId, { project: String(issue.projectId) });
	await issuePage.expectLoaded(issue.title);
	await issuePage.expectRulesReady();

	const drawer = await issuePage.openNewRule();
	await drawer.pickTest(failing.testName, failing.pathStr);
	// Gated off every run, so the rule never stamps a run another scenario
	// applies its rules to.
	await drawer.addTags([NO_RUN_TAG]);
	await drawer.setCategory('Known');
	await drawer.setDisposition('Expected');
	if (verdicts.length) await drawer.addVerdicts(verdicts);
	await drawer.submit();
	await drawer.expectClosed();
	await issuePage.expectRuleListed(
		issuePage.ruleRowByTest(failing.testName).first()
	);

	return issue;
}

async function openRulesFor(
	page: Page,
	issue: RecordedIssue,
	failing?: ClassifiableTestPath
): Promise<{ rulesPage: IssueRulesPage; row: Locator }> {
	const rulesPage = new IssueRulesPage(page);

	await rulesPage.goto({ project: String(issue.projectId) });
	await rulesPage.expectLoaded();
	if (failing) await rulesPage.table.search(failing.testName);

	const row = rulesPage.rowsByIssue(issue.title).first();
	await rulesPage.expectRuleListed(row);

	return { rulesPage, row };
}

async function removeIssue(page: Page, issue: RecordedIssue): Promise<void> {
	const issuesPage = new IssuesPage(page);

	await issuesPage.goto({ project: String(issue.projectId) });
	await issuesPage.expectLoaded();
	await issuesPage.table.search(issue.title);
	await issuesPage.deleteIssue(issue.title);
	cleanup.forget(issue.issueId);
}

test.describe('Issue Rules Page', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await cleanup.sweep(request);
	});

	test(
		'The rules page lists rules in a table',
		{ tag: ['@issues', '@smoke'] },
		async ({ page, request }) => {
			const rulesPage = new IssueRulesPage(page);
			const projectId = await fixtureProjectId(request);

			await when('I open the rules page for the fixture project', () =>
				rulesPage.goto({ project: String(projectId) })
			);
			await then('the rules table or its empty state is shown', () =>
				rulesPage.expectLoaded()
			);
		}
	);

	test(
		'A rule is written from the New Rule drawer and removed again',
		RULES_WRITE,
		async ({ page, request }) => {
			const failing = failingTest();
			const verdict = String(failing.sample.verdicts[0]);
			const rulesPage = new IssueRulesPage(page);
			let issue!: RecordedIssue;
			let row!: Locator;

			await given('I record an issue for the rule', async () => {
				issue = await recordIssue(page, request, 'drawer');
			});
			await and('I open the rules page for the fixture project', async () => {
				await rulesPage.goto({ project: String(issue.projectId) });
				await rulesPage.expectLoaded();
			});
			const drawer = await when(
				'I open the New Rule drawer and submit it empty',
				async () => {
					const opened = await rulesPage.openNewRule();
					await opened.submit();

					return opened;
				}
			);
			await then('I am told to select an issue and a test', () =>
				drawer.expectValidation('Select an issue', 'Select a test')
			);
			await when(
				'I pick the issue, a failing test and a verdict to match on and create the rule',
				async () => {
					await drawer.pickIssue(issue.title);
					await drawer.pickTest(failing.testName, failing.pathStr);
					await drawer.setCategory('Known');
					await drawer.setDisposition('Expected');
					await drawer.addVerdicts([verdict]);
					// Gated off every run, so the rule never stamps a run another
					// scenario applies its rules to.
					await drawer.addTags([NO_RUN_TAG]);
					await drawer.submit();
					await drawer.expectClosed();
				}
			);
			await then(
				'the rule is listed under the issue with Path and Verdicts in its match scope',
				async () => {
					await rulesPage.table.search(failing.testName);
					row = rulesPage.rowsByIssue(issue.title).first();
					await rulesPage.expectRuleListed(row);
					await rulesPage.expectRuleActive(row, true);
					await rulesPage.expectScopeChips(row, ['Path', 'Verdicts']);
				}
			);
			await and(
				'hovering the Verdicts chip shows the verdict it matches',
				async () => {
					await rulesPage.hoverScopeChip(row, 'Verdicts');
					await rulesPage.expectScopeHoverCardTitled('Verdicts');
					await expect(rulesPage.scopeHoverCard).toContainText(verdict);
				}
			);
			await when('I delete the rule', () => rulesPage.deleteRule(row));
			await then('the rule is no longer listed', () =>
				rulesPage.table.expectRowGone(row)
			);
			await and('I delete the issue', () => removeIssue(page, issue));
		}
	);

	test(
		'Rule filters are written to the URL and cleared together',
		RULES_WRITE_URL,
		async ({ page, request }) => {
			const failing = failingTest();
			let issue!: RecordedIssue;
			let rulesPage!: IssueRulesPage;
			let row!: Locator;

			await given('I record an issue with an expected rule', async () => {
				issue = await recordIssueWithRule(page, request, 'filters', failing);
			});
			await and(
				"I open the rules page for the fixture project and search for the rule's test",
				async () => {
					({ rulesPage, row } = await openRulesFor(page, issue, failing));
					await rulesPage.expectParams({ q: failing.testName });
				}
			);
			await when('I pick Expected in the Disposition filter', () =>
				rulesPage.table.toggleFacet('Disposition', 'Expected')
			);
			await then(
				'the disposition is written to the URL and the rule is still listed',
				async () => {
					await rulesPage.expectParams({ disposition: 'expected' });
					await rulesPage.expectRuleListed(row);
				}
			);
			await when('I pick Active in the Rule filter', () =>
				rulesPage.table.toggleFacet('Rule', 'Active')
			);
			await then(
				'the active state is written to the URL and the rule is still listed',
				async () => {
					await rulesPage.expectParams({ active: 'true' });
					await rulesPage.expectRuleListed(row);
				}
			);
			await when('I search for text no rule carries', () =>
				rulesPage.table.search(`${issue.title} nothing-carries-this`)
			);
			await then('no matching rules are shown', () =>
				rulesPage.table.expectNoMatching()
			);
			await when('I reset the filters', () => rulesPage.table.reset());
			await then(
				'the disposition, active state and search are cleared from the URL',
				async () => {
					await rulesPage.expectParams({
						disposition: null,
						active: null,
						q: null
					});
					await rulesPage.table.expectResetDisabled();
				}
			);
			await and('I delete the issue', () => removeIssue(page, issue));
		}
	);

	test(
		'A verdict chip toggles the repeated verdicts parameter',
		RULES_WRITE_URL,
		async ({ page, request }) => {
			const failing = failingTest();
			const verdict = String(failing.sample.verdicts[0]);
			let issue!: RecordedIssue;
			let rulesPage!: IssueRulesPage;
			let row!: Locator;

			await given(
				'I record an issue with a rule matching a verdict',
				async () => {
					issue = await recordIssueWithRule(page, request, 'verdict', failing, [
						verdict
					]);
				}
			);
			await and(
				"I open the rules page for the fixture project and search for the rule's test",
				async () => {
					({ rulesPage, row } = await openRulesFor(page, issue, failing));
				}
			);
			await when('I turn the Verdicts column on', async () => {
				await rulesPage.table.toggleColumn('Verdicts');
				await rulesPage.table.expectColumnShown('Verdicts');
			});
			await and("I click the rule's verdict chip", () =>
				rulesPage.matcherChip(row, verdict).click()
			);
			await then('the verdict is written to the URL once per value', () =>
				rulesPage.expectRepeatedParam('verdicts', [verdict])
			);
			await when('I click the chip again', () =>
				rulesPage.matcherChip(row, verdict).click()
			);
			await then('the verdict is cleared from the URL', () =>
				rulesPage.expectRepeatedParam('verdicts', [])
			);
			await and('I delete the issue', async () => {
				await rulesPage.table.toggleColumn('Verdicts');
				await removeIssue(page, issue);
			});
		}
	);

	test(
		'Sorting rules by test is written to the URL',
		{ tag: ['@issues', '@issues-write', '@needs-nok', '@url-params'] },
		async ({ page, request }) => {
			const failing = failingTest();
			let issue!: RecordedIssue;
			let rulesPage!: IssueRulesPage;

			await given(
				'I open the rules page for the fixture project with a rule listed',
				async () => {
					issue = await recordIssueWithRule(page, request, 'sort', failing);
					({ rulesPage } = await openRulesFor(page, issue));
				}
			);
			await when('I sort by the Test column', () =>
				rulesPage.table.sortBy('Test')
			);
			await then('the sort is written to the URL as ascending', () =>
				rulesPage.expectParams({ sort: 'test:asc' })
			);
			await when('I sort by the Test column again', () =>
				rulesPage.table.sortBy('Test')
			);
			await then('the sort is written to the URL as descending', () =>
				rulesPage.expectParams({ sort: 'test:desc' })
			);
			await and('I delete the issue', () => removeIssue(page, issue));
		}
	);

	test(
		'Editing a rule keeps its test but changes its disposition',
		RULES_WRITE,
		async ({ page, request }) => {
			const failing = failingTest();
			let issue!: RecordedIssue;
			let rulesPage!: IssueRulesPage;
			let row!: Locator;

			await given('I record an issue with an expected rule', async () => {
				issue = await recordIssueWithRule(page, request, 'edit', failing);
			});
			await and(
				"I open the rules page for the fixture project and search for the rule's test",
				async () => {
					({ rulesPage, row } = await openRulesFor(page, issue, failing));
				}
			);
			const drawer = await when('I edit the rule', () =>
				rulesPage.editRule(row)
			);
			await then(
				'the issue and test cannot be changed and the matcher is read-only',
				async () => {
					await drawer.expectIssueLocked();
					await drawer.expectTestDisabled();
					await drawer.expectProjectDisabled();
					await drawer.expectMatcherReadonly();
					await drawer.expectDisposition('Expected');
				}
			);
			await when('I make the rule unexpected', () =>
				drawer.setDisposition('Unexpected')
			);
			await then('the Expected field says its results still count', () =>
				drawer.expectDispositionHint(
					'Results matching this rule are explained but still count as unexpected.'
				)
			);
			await when('I save the rule', async () => {
				await drawer.submit();
				await drawer.expectClosed();
			});
			await then(
				'the Disposition column, once shown, reads Unexpected',
				async () => {
					await rulesPage.table.toggleColumn('Disposition');
					await rulesPage.table.expectColumnShown('Disposition');
					await rulesPage.expectDisposition(row, 'Unexpected');
					await rulesPage.table.toggleColumn('Disposition');
				}
			);
			await and('I delete the issue', () => removeIssue(page, issue));
		}
	);

	test(
		'A narrow viewport folds a rule into an expander',
		RULES_WRITE,
		async ({ page, request }) => {
			const failing = failingTest();
			let issue!: RecordedIssue;
			let rulesPage!: IssueRulesPage;
			let row!: Locator;

			await given('I record an issue with an expected rule', async () => {
				issue = await recordIssueWithRule(page, request, 'narrow', failing);
			});
			await and(
				"I open the rules page for the fixture project in a narrow window and search for the rule's test",
				async () => {
					await page.setViewportSize({ width: 900, height: 900 });
					({ rulesPage, row } = await openRulesFor(page, issue, failing));
				}
			);
			await then("the rule's row carries an expander", () =>
				rulesPage.expectCompactRow(row)
			);
			await when('I expand the row', () => rulesPage.expandRow(row));
			await then('its match scope is shown in a detail panel', () =>
				expect(rulesPage.detail).toContainText('Match Scope')
			);
			await and('I delete the issue', async () => {
				await page.setViewportSize({ width: 1280, height: 900 });
				await removeIssue(page, issue);
			});
		}
	);

	test(
		"Parameter and tag inputs become the new rule's parameters and tags",
		RULES_WRITE,
		async ({ page, request }) => {
			const failing = failingTest();
			// Values no run carries: the tag gates the rule off every run, so it
			// never stamps anything.
			const stamp = Date.now().toString(36);
			const parameter = { name: 'e2e_param', value: stamp };
			const tag = { name: 'e2e_tag', value: stamp };
			const rulesPage = new IssueRulesPage(page);
			let issue!: RecordedIssue;

			await given('I record an issue for the rule', async () => {
				issue = await recordIssue(page, request, 'matcher');
			});
			await when(
				'I write a rule for a failing test with a parameter and a tag to match on',
				async () => {
					await rulesPage.goto({ project: String(issue.projectId) });
					await rulesPage.expectLoaded();
					const drawer = await rulesPage.openNewRule();
					await drawer.pickIssue(issue.title);
					await drawer.pickTest(failing.testName, failing.pathStr);
					await drawer.addParameters([`${parameter.name}=${parameter.value}`]);
					await drawer.addTags([`${tag.name}=${tag.value}`]);
					await drawer.submit();
					await drawer.expectClosed();
				}
			);
			await then(
				'the rule is listed matching on Path, Params and Tags',
				async () => {
					await rulesPage.table.search(issue.title);
					await rulesPage.expectRuleListed(rulesPage.rowsByIssue(issue.title));
					await rulesPage.expectScopeChipsExactly(
						rulesPage.rowsByIssue(issue.title),
						['Path', 'Params', 'Tags']
					);
				}
			);
			await and(
				'the Parameters and Tags columns, once shown, read the values I typed',
				async () => {
					const row = rulesPage.rowsByIssue(issue.title);
					await rulesPage.table.toggleColumn('Parameters');
					await rulesPage.table.toggleColumn('Tags');
					await rulesPage.expectMatcherChip(
						row,
						`${parameter.name}: ${parameter.value}`
					);
					await rulesPage.expectMatcherChip(row, `${tag.name}: ${tag.value}`);
					await rulesPage.table.toggleColumn('Parameters');
					await rulesPage.table.toggleColumn('Tags');
				}
			);
			await and('I delete the issue', () => removeIssue(page, issue));
		}
	);

	test(
		'A rule created as inactive is listed inactive',
		RULES_WRITE,
		async ({ page, request }) => {
			const failing = failingTest();
			const rulesPage = new IssueRulesPage(page);
			let issue!: RecordedIssue;

			await given('I record an issue for the rule', async () => {
				issue = await recordIssue(page, request, 'inactive');
			});
			await when(
				'I write a rule for a failing test and set it to Inactive',
				async () => {
					await rulesPage.goto({ project: String(issue.projectId) });
					await rulesPage.expectLoaded();
					const drawer = await rulesPage.openNewRule();
					await drawer.pickIssue(issue.title);
					await drawer.pickTest(failing.testName, failing.pathStr);
					await drawer.setActive(false);
					await drawer.submit();
					await drawer.expectClosed();
				}
			);
			await then('the rule is listed as inactive', async () => {
				const row = rulesPage.rowsByIssue(issue.title);
				await rulesPage.table.search(issue.title);
				await rulesPage.expectRuleListed(row);
				await rulesPage.expectRuleActive(row, false);
			});
			await and('its issue has no active rules', async () => {
				const issuesPage = new IssuesPage(page);
				await issuesPage.goto({ project: String(issue.projectId) });
				await issuesPage.expectLoaded();
				await issuesPage.table.search(issue.title);
				await issuesPage.expectRulesBadge(
					issue.title,
					'dormant',
					'0 of 1 active'
				);
			});
			await and('I delete the issue', () => removeIssue(page, issue));
		}
	);

	test(
		'A parameter typed without an equals sign is dropped from the rule',
		RULES_WRITE,
		async ({ page, request }) => {
			const failing = failingTest();
			const rulesPage = new IssueRulesPage(page);
			let issue!: RecordedIssue;
			let drawer!: RuleDrawer;

			await given('I record an issue for the rule', async () => {
				issue = await recordIssue(page, request, 'malformed');
			});
			await when(
				'I start an inactive rule for a failing test and type a parameter with no equals sign',
				async () => {
					await rulesPage.goto({ project: String(issue.projectId) });
					await rulesPage.expectLoaded();
					drawer = await rulesPage.openNewRule();
					await drawer.pickIssue(issue.title);
					await drawer.pickTest(failing.testName, failing.pathStr);
					// Inactive rather than gated by a tag, which would join Path in
					// the match scope: either way it never stamps a run another
					// scenario applies its rules to.
					await drawer.setActive(false);
					await drawer.addParameters(['no_equals_sign']);
				}
			);
			await then('the drawer takes the entry without complaint', async () => {
				await drawer.expectParameterEntered('no_equals_sign');
				await drawer.expectNoValidationErrors();
			});
			await when('I create the rule', async () => {
				await drawer.submit();
				await drawer.expectClosed();
			});
			await then(
				'the rule is listed matching on its Path alone, the entry gone',
				async () => {
					const row = rulesPage.rowsByIssue(issue.title);
					await rulesPage.table.search(issue.title);
					await rulesPage.expectRuleListed(row);
					await rulesPage.expectScopeChipsExactly(row, ['Path']);
				}
			);
			await and('I delete the issue', () => removeIssue(page, issue));
		}
	);
});

test.describe('Issue Rules Page (signed out)', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test(
		'Writing rules while signed out asks me to sign in',
		{ tag: ['@issues', '@auth'] },
		async ({ page }) => {
			const rulesPage = new IssueRulesPage(page);
			const dialog = page.getByTestId('login-dialog');
			const sessionChecked = page.waitForResponse(
				(response) =>
					response.url().includes('/auth/profile/info/') &&
					response.status() === 403
			);
			const loginRequiredAction = rulesPage
				.loginRequiredAction('Log in to create rules')
				.first();

			await given('I am signed out and open the rules page', async () => {
				await rulesPage.goto();
				await sessionChecked;
				await rulesPage.expectLoaded();
			});
			await then('the New Rule action is disabled with a hint to log in', () =>
				expect(loginRequiredAction).toHaveText(/New Rule/, { timeout: 30_000 })
			);
			await when('I click it anyway', () => loginRequiredAction.click());
			await then('I am asked to sign in to create rules', async () => {
				await expect(dialog.getByText('Log in to create rules.')).toBeVisible({
					timeout: 15_000
				});
				await expect(
					dialog.getByRole('button', { name: 'Sign in' })
				).toBeVisible();
			});
			await when('I close the sign-in dialog', () =>
				page.keyboard.press('Escape')
			);
			await then('the sign-in dialog is closed', () =>
				expect(dialog).toHaveCount(0, { timeout: 15_000 })
			);
		}
	);
});
