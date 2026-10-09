/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { test } from './support/test';
import type { APIRequestContext, Page } from '@playwright/test';

import type { ClassifyDrawer } from './pages/classify-drawer';
import { IssueRulesPage } from './pages/issue-rules-page';
import { IssuesPage } from './pages/issues-page';
import type { CategoryLabel } from './pages/rule-drawer';
import { RunIssuesPage } from './pages/run-issues-page';
import { RunPage } from './pages/run-page';
import { requireCapability } from './support/capabilities';
import {
	CATEGORY_BADGE,
	CATEGORY_HINT,
	IssueCleanup
} from './support/classification';
import type { IssueCategory } from './support/classification';
import { projectIdByName } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { claimFailingResult } from './support/sample-cases';
import type { ClassifiableResult } from './support/sample-cases';

const CLASSIFY_WRITE = { tag: ['@issues', '@issues-write', '@needs-nok'] };

const cleanup = new IssueCleanup('classify');

/** The tracker the fixture run's project configures first. */
const FIXTURE_TRACKER = 'E2E_BUGS';

interface OpenDrawer {
	drawer: ClassifyDrawer;
	failing: ClassifiableResult;
	projectId: number;
}

/** Leases a failing result and opens the Classify drawer on it from its run. */
async function openClassifyDrawer(
	page: Page,
	request: APIRequestContext
): Promise<OpenDrawer> {
	const failing = await claimFailingResult(
		request,
		`classify ${test.info().title}`
	);
	const projectId = requireCapability(
		await projectIdByName(request, failing.run.bundle.project),
		`Project "${failing.run.bundle.project}" is not registered.`
	);
	const runPage = new RunPage(page);

	await runPage.goto(failing.run.runId);
	await runPage.expectLoaded(failing.run.expectedRun.name);
	const table = await runPage.openResultTableAt(
		failing.path.slice(0, -1),
		failing.testName
	);
	const drawer = await runPage.openClassify(
		table,
		await runPage.resultIndexOf(table, failing.resultId)
	);

	return { drawer, failing, projectId };
}

/** Finds the scenario's issue on the issues page and registers it for the sweep. */
async function findIssue(
	page: Page,
	projectId: number,
	title: string
): Promise<IssuesPage> {
	const issuesPage = new IssuesPage(page);

	await issuesPage.goto({ project: String(projectId) });
	await issuesPage.expectLoaded();
	await issuesPage.table.search(title);
	await issuesPage.expectIssueListed(title);
	cleanup.register(
		Number(await issuesPage.rowByTitle(title).getAttribute('data-issue-id')),
		projectId
	);

	return issuesPage;
}

async function removeIssue(
	issuesPage: IssuesPage,
	title: string
): Promise<void> {
	const issueId = Number(
		await issuesPage.rowByTitle(title).getAttribute('data-issue-id')
	);

	await issuesPage.deleteIssue(title);
	cleanup.forget(issueId);
}

/** A bug key no other scenario, browser or run of this one uses. */
function uniqueBugKey(): string {
	return `E2E-${test.info().project.name}-${Date.now().toString(36)}`;
}

async function classifiesWithCategory(
	page: Page,
	request: APIRequestContext,
	category: IssueCategory
): Promise<void> {
	const title = cleanup.title(`category ${category}`);
	let opened!: OpenDrawer;
	let issuesPage!: IssuesPage;

	await given(
		'I open the Classify drawer on a failing result of the fixture run',
		async () => {
			opened = await openClassifyDrawer(page, request);
		}
	);
	await when('I pick the category for a new issue', async () => {
		await opened.drawer.fillNewIssue({ title });
		await opened.drawer.setCategory(CATEGORY_BADGE[category] as CategoryLabel);
	});
	await then('the Category field explains the picked category', () =>
		opened.drawer.expectCategoryHint(CATEGORY_HINT[category])
	);
	await when('I classify the result', () => opened.drawer.submit());
	await then(
		"the issues page shows the issue with that category's badge",
		async () => {
			issuesPage = await findIssue(page, opened.projectId, title);
			await issuesPage.expectCategory(title, category);
		}
	);
	await and('I delete the issue', () => removeIssue(issuesPage, title));
}

test.describe('Classify drawer', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await cleanup.sweep(request);
	});

	test(
		'Classifying into a new issue records its tracker and bug key',
		CLASSIFY_WRITE,
		async ({ page, request }) => {
			const title = cleanup.title('bug key');
			const key = uniqueBugKey();
			let opened!: OpenDrawer;
			let issuesPage!: IssuesPage;

			await given(
				'I open the Classify drawer on a failing result of the fixture run',
				async () => {
					opened = await openClassifyDrawer(page, request);
				}
			);
			await when(
				'I pick a tracker, type a bug key and classify the result under a new issue',
				async () => {
					await opened.drawer.titleInput.fill(title);
					await opened.drawer.pickTracker(FIXTURE_TRACKER);
					await opened.drawer.bugKeyInput.fill(key);
					await opened.drawer.submit();
				}
			);
			await then('the issues page shows the issue with that key', async () => {
				issuesPage = await findIssue(page, opened.projectId, title);
				await issuesPage.expectKey(title, key);
			});
			await and("the key links to the tracker's page for it", () =>
				issuesPage.expectBugLink(title, key)
			);
			await and('I delete the issue', () => removeIssue(issuesPage, title));
		}
	);

	test(
		'Pasting a full reference splits it into tracker and key',
		{ tag: ['@issues', '@needs-nok'] },
		async ({ page, request }) => {
			let opened!: OpenDrawer;

			await given(
				'I open the Classify drawer on a failing result of the fixture run',
				async () => {
					opened = await openClassifyDrawer(page, request);
				}
			);
			await when('I paste a full ref:// reference into the bug key', () =>
				opened.drawer.pasteBugKey('ref://PASTED_TRACKER/PASTE-42')
			);
			await then("the tracker takes the reference's tracker", () =>
				opened.drawer.expectTracker('PASTED_TRACKER')
			);
			await and('the bug key keeps only the key', () =>
				opened.drawer.expectBugKey('PASTE-42')
			);
			await and('I close the drawer without classifying', () =>
				opened.drawer.close()
			);
		}
	);

	test.describe('Classifying with a category shows it on the new issue', () => {
		test('Product defect', CLASSIFY_WRITE, ({ page, request }) =>
			classifiesWithCategory(page, request, 'product-defect')
		);

		test('Test/automation bug', CLASSIFY_WRITE, ({ page, request }) =>
			classifiesWithCategory(page, request, 'test-bug')
		);

		test('Environment / infra', CLASSIFY_WRITE, ({ page, request }) =>
			classifiesWithCategory(page, request, 'env')
		);

		test('Known issue', CLASSIFY_WRITE, ({ page, request }) =>
			classifiesWithCategory(page, request, 'known-issue')
		);

		test('Flaky / intermittent', CLASSIFY_WRITE, ({ page, request }) =>
			classifiesWithCategory(page, request, 'flaky')
		);

		test('To investigate', CLASSIFY_WRITE, ({ page, request }) =>
			classifiesWithCategory(page, request, 'to-investigate')
		);
	});

	test(
		'Classifying as unexpected still counts against the run',
		CLASSIFY_WRITE,
		async ({ page, request }) => {
			const title = cleanup.title('unexpected');
			let opened!: OpenDrawer;
			const runIssuesPage = new RunIssuesPage(page);

			await given(
				'I open the Classify drawer on a failing result of the fixture run',
				async () => {
					opened = await openClassifyDrawer(page, request);
				}
			);
			await when(
				'I classify the result under a new issue as unexpected',
				async () => {
					await opened.drawer.fillNewIssue({ title });
					await opened.drawer.setDisposition('Unexpected');
					await opened.drawer.submit();
				}
			);
			await then(
				"the run's issues page lists the issue as still counting",
				async () => {
					await runIssuesPage.goto(opened.failing.runId);
					await runIssuesPage.expectLoaded();
					await runIssuesPage.table.search(title);
					await runIssuesPage.expectIssueListed(title);
					cleanup.register(
						Number(
							await runIssuesPage
								.rowByTitle(title)
								.getAttribute('data-issue-id')
						),
						opened.projectId
					);
					await runIssuesPage.expectEffect(title, 'unexpected');
				}
			);
			await and('I delete the issue from the run issues page', async () => {
				const row = runIssuesPage.rowByTitle(title);
				const issueId = Number(await row.getAttribute('data-issue-id'));
				await runIssuesPage.deleteIssue(row, title);
				await runIssuesPage.expectIssueGone(title);
				cleanup.forget(issueId);
			});
		}
	);

	test(
		'A narrower match scope is what the new rule matches on',
		CLASSIFY_WRITE,
		async ({ page, request }) => {
			const title = cleanup.title('scope');
			const rulesPage = new IssueRulesPage(page);
			let opened!: OpenDrawer;

			await given(
				'I open the Classify drawer on a failing result of the fixture run',
				async () => {
					opened = await openClassifyDrawer(page, request);
				}
			);
			// Just this result: the rule is written inactive, so a rule that
			// matches every result of the test with these verdicts never reaches
			// a run another scenario applies its rules to.
			await when(
				'I narrow the match scope to the path and verdicts and classify just this result',
				async () => {
					await opened.drawer.fillNewIssue({ title });
					await opened.drawer.choosePreset('Path + Verdicts');
					await opened.drawer.expectFlags({
						matchParameters: false,
						matchVerdicts: true,
						matchTags: false
					});
					await opened.drawer.setScope('Just this result');
					await opened.drawer.submit();
				}
			);
			await then(
				"the rules page shows the issue's rule matching on Path and Verdicts only",
				async () => {
					const row = rulesPage.rowsByIssue(title);
					await rulesPage.goto({ project: String(opened.projectId) });
					await rulesPage.expectLoaded();
					await rulesPage.table.search(title);
					await rulesPage.expectRuleListed(row);
					await rulesPage.expectScopeChipsExactly(row, ['Path', 'Verdicts']);
				}
			);
			await and('the rule is inactive, as a one-off', () =>
				rulesPage.expectRuleActive(rulesPage.rowsByIssue(title), false)
			);
			await and('I delete the issue', async () => {
				const issuesPage = await findIssue(page, opened.projectId, title);
				await removeIssue(issuesPage, title);
			});
		}
	);
});
