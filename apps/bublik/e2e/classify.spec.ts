/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { test } from './support/test';
import { expect } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';

import type { ClassifyDrawer } from './pages/classify-drawer';
import { IssueRulesPage } from './pages/issue-rules-page';
import { IssuesPage } from './pages/issues-page';
import type { CategoryLabel } from './pages/rule-drawer';
import { ResultStamps } from './pages/result-stamps';
import { RunIssuesPage } from './pages/run-issues-page';
import { RunPage } from './pages/run-page';
import { requireCapability } from './support/capabilities';
import {
	CATEGORY_BADGE,
	CATEGORY_HINT,
	IssueCleanup,
	uniqueBugKey
} from './support/classification';
import type { IssueCategory } from './support/classification';
import { projectIdByName } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import {
	claimClassifiableTest,
	claimFailingResult,
	resultsOfRun
} from './support/sample-cases';
import type {
	ClassifiableResult,
	ClassifiableRun,
	RunTestResult
} from './support/sample-cases';

const CLASSIFY_WRITE = { tag: ['@issues', '@issues-write', '@needs-nok'] };

/** Whatever the run's other rules add, the toast reads one of these. */
const ANY_APPLIED = /^Applied — (no new stamps|\d+ stamps? created)$/;

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

/** The first failing result of each test of the run, tests in order of their first result. */
function firstFailingOfEachTest(
	results: readonly RunTestResult[]
): RunTestResult[] {
	const byTest = new Map<string, RunTestResult>();

	for (const result of [...results]
		.filter((candidate) => candidate.hasError)
		.sort((a, b) => a.resultId - b.resultId)) {
		if (!byTest.has(result.testPath)) byTest.set(result.testPath, result);
	}

	return [...byTest.values()];
}

/**
 * The results of a test every one of which failed, unsuppressed, with the
 * same verdicts: a rule for the test on those verdicts matches exactly them.
 * The test with the smallest first result wins, so the pick is stable.
 */
function wholeFailingTest(
	results: readonly RunTestResult[]
): RunTestResult[] | null {
	const byTest = new Map<string, RunTestResult[]>();

	for (const result of [...results].sort((a, b) => a.resultId - b.resultId)) {
		byTest.set(result.testPath, [
			...(byTest.get(result.testPath) ?? []),
			result
		]);
	}

	return (
		[...byTest.values()].find(
			(group) =>
				group.length >= 2 &&
				group.every(
					(result) =>
						result.hasError &&
						result.verdicts.length > 0 &&
						result.verdicts.join('\n') === group[0].verdicts.join('\n')
				)
		) ?? null
	);
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
		'Classifying under several categories gives the issue a rule per category',
		CLASSIFY_WRITE,
		async ({ page, request }) => {
			const title = cleanup.title('several categories');
			const rulesPage = new IssueRulesPage(page);
			let opened!: OpenDrawer;

			await given(
				'I open the Classify drawer on a failing result of the fixture run',
				async () => {
					opened = await openClassifyDrawer(page, request);
				}
			);
			await when('I check Known and Flaky for a new issue', async () => {
				await opened.drawer.fillNewIssue({ title });
				await opened.drawer.setCategories(['Known', 'Flaky']);
			});
			await then(
				'the disposition proposes Expected, as both causes are explained',
				() => expect(opened.drawer.expectedField).toContainText('Expected')
			);
			await when('I classify the result', () => opened.drawer.submit());
			await then(
				'the rules page lists one rule of the issue per category',
				async () => {
					const rows = rulesPage.rowsByIssue(title);
					await rulesPage.goto({ project: String(opened.projectId) });
					await rulesPage.expectLoaded();
					await rulesPage.table.search(title);
					await rulesPage.expectRuleListed(rows.first());
					await expect(rows).toHaveCount(2, { timeout: 15_000 });
					for (const category of ['known-issue', 'flaky'] as const) {
						await expect(
							rows.filter({
								has: page.locator(`[data-category="${category}"]`)
							})
						).toHaveCount(1);
					}
				}
			);
			await and('I delete the issue', async () => {
				const issuesPage = await findIssue(page, opened.projectId, title);
				await removeIssue(issuesPage, title);
			});
		}
	);

	test(
		'The Classify drawer needs at least one category',
		{ tag: ['@issues', '@needs-nok'] },
		async ({ page, request }) => {
			let opened!: OpenDrawer;

			await given(
				'I open the Classify drawer on a failing result of the fixture run',
				async () => {
					opened = await openClassifyDrawer(page, request);
				}
			);
			await when('I uncheck the one checked category', async () => {
				await opened.drawer.expectCategories(['Investigate']);
				await opened.drawer.toggleCategory('Investigate');
				await opened.drawer.expectCategories([]);
			});
			await then('the disposition stays as it was', () =>
				expect(opened.drawer.expectedField).toContainText('Marked')
			);
			await when('I classify the result', () =>
				opened.drawer.submitButton.click()
			);
			await then('the Category field asks for at least one category', () =>
				opened.drawer.expectValidation('Select at least one category')
			);
			await and('I close the drawer without classifying', () =>
				opened.drawer.close()
			);
		}
	);

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
					await opened.drawer.clearMatch('parameters');
					await opened.drawer.clearMatch('tags');
					await opened.drawer.expectMatch({
						parameters: false,
						verdicts: true,
						tags: false
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

	test(
		"Classifying results of several tests at once writes a rule per test with that test's own values",
		CLASSIFY_WRITE,
		async ({ page, request }) => {
			// Reads the run's results and applies its rules besides classifying,
			// and the first in a worker reads the classifiable pool: a minute is
			// short for that under load.
			test.slow();
			const title = cleanup.title('two tests');
			const runPage = new RunPage(page);
			const stamps = new ResultStamps(page);
			const rulesPage = new IssueRulesPage(page);
			let run!: ClassifiableRun;
			let picked: RunTestResult[] = [];
			let projectId = 0;
			let issueId = 0;

			await given(
				'I pick a failing result of each of two tests of a run of my own',
				async () => {
					const leased = await claimClassifiableTest(
						request,
						`classify ${test.info().title}`
					);
					run = leased.run;
					projectId = requireCapability(
						await projectIdByName(request, run.bundle.project),
						`Project "${run.bundle.project}" is not registered.`
					);
					picked = firstFailingOfEachTest(
						await resultsOfRun(request, run)
					).slice(0, 2);
					requireCapability(
						picked.length === 2,
						`Run ${run.runId} has failing results of fewer than two tests.`
					);

					await runPage.goto(run.runId);
					await runPage.expectLoaded(run.expectedRun.name);
					// Both tables first: the selection popover the first pick
					// opens sits over the tree's lower rows.
					const tables = [];
					for (const result of picked) {
						tables.push(await stamps.openTestResults(result.path));
					}
					for (const [index, result] of picked.entries()) {
						await runPage.selectResultCell(
							runPage.resultCellOf(tables[index], result.resultId)
						);
					}
				}
			);
			await when(
				'I classify them under a new issue, keeping the match scope of each test',
				async () => {
					const drawer = await runPage.classifySelection();
					await drawer.expectTestCards(picked.map((result) => result.testName));
					await drawer.fillNewIssue({ title });
					issueId = await drawer.submitForIssueId();
					cleanup.register(issueId, projectId);
				}
			);
			await then(
				"the rules page lists a rule of the issue per test, each matching on that test's path, parameters, verdicts and tags",
				async () => {
					await rulesPage.goto({ project: String(projectId) });
					await rulesPage.expectLoaded();
					await rulesPage.table.search(title);
					const rows = rulesPage.rowsByIssue(title);
					await expect(rows).toHaveCount(2, { timeout: 15_000 });
					for (const result of picked) {
						const row = rows.filter({
							has: page
								.getByTestId('issue-rule-test')
								.filter({ hasText: result.testName })
						});
						await rulesPage.expectRuleListed(row);
						await rulesPage.expectScopeChipsExactly(row, [
							'Path',
							'Params',
							'Verdicts',
							'Tags'
						]);
					}
				}
			);
			await and(
				'each picked result carries a single stamp of the issue',
				async () => {
					await runPage.goto(run.runId);
					await runPage.expectLoaded(run.expectedRun.name);
					for (const result of picked) {
						const table = await stamps.openTestResults(result.path);
						await stamps.expectSingleStamp(
							runPage.resultCellOf(table, result.resultId),
							issueId
						);
					}
				}
			);
			await and('I delete the issue', async () => {
				const issuesPage = await findIssue(page, projectId, title);
				await removeIssue(issuesPage, title);
			});
		}
	);

	test(
		'Classifying one result for future runs stamps it alone until the rules are applied',
		CLASSIFY_WRITE,
		async ({ page, request }) => {
			// Reads the run's results and applies its rules besides classifying,
			// and the first in a worker reads the classifiable pool: a minute is
			// short for that under load.
			test.slow();
			const title = cleanup.title('until applied');
			const runPage = new RunPage(page);
			const stamps = new ResultStamps(page);
			let run!: ClassifiableRun;
			let matched: RunTestResult[] = [];
			let projectId = 0;
			let issueId = 0;
			let applied = '';

			await given(
				'a run of my own, its other active rules already applied, has a test every result of which failed with the same verdicts',
				async () => {
					const leased = await claimClassifiableTest(
						request,
						`classify ${test.info().title}`
					);
					run = leased.run;
					projectId = requireCapability(
						await projectIdByName(request, run.bundle.project),
						`Project "${run.bundle.project}" is not registered.`
					);
					// Rules the seed or other scenarios left active may not have
					// reached this run yet; applied first, they leave the rule
					// this scenario writes the only one with anything to stamp.
					await runPage.goto(run.runId);
					await runPage.expectLoaded(run.expectedRun.name);
					expect(await runPage.applyRules()).toMatch(ANY_APPLIED);
					// Read once the other rules stamped what they match: the rule
					// matches every unexpected result of the test, stamped or not,
					// so the test must have none a stamp hides.
					matched = requireCapability(
						wholeFailingTest(await resultsOfRun(request, run)),
						`Run ${run.runId} has no test whose every result failed with the same verdicts.`
					);
				}
			);
			await when(
				"I classify one of its results under a new issue for future runs, matching on the path, its verdicts and the run's tags",
				async () => {
					const table = await stamps.openTestResults(matched[0].path);
					const drawer = await stamps.openClassify(
						runPage.resultCellOf(table, matched[0].resultId)
					);
					await drawer.fillNewIssue({ title });
					await drawer.clearMatch('parameters');
					await drawer.expectMatch({
						parameters: false,
						verdicts: true,
						tags: true
					});
					issueId = await drawer.submitForIssueId();
					cleanup.register(issueId, projectId);
				}
			);
			await then(
				'only that result carries a stamp of the issue, laid by hand',
				async () => {
					const table = await stamps.openTestResults(matched[0].path);
					await stamps.expectSingleStamp(table, issueId);
					await stamps.expectSingleStamp(
						runPage.resultCellOf(table, matched[0].resultId),
						issueId
					);
					await stamps.expectOrigin(
						stamps.stampsOf(table, issueId).first(),
						title,
						'manual_persistent'
					);
				}
			);
			await when('I apply the rules to the run from its page', async () => {
				applied = await runPage.applyRules();
			});
			await then(
				"the toast reports exactly the test's other failing results stamped",
				() => {
					const added = matched.length - 1;
					expect(applied).toBe(
						`Applied — ${added} stamp${added === 1 ? '' : 's'} created`
					);
				}
			);
			await and(
				'every result of the test carries a stamp of the issue',
				async () => {
					const table = await stamps.openTestResults(matched[0].path);
					await stamps.expectStampCount(table, issueId, matched.length);
				}
			);
			await and('I delete the issue', async () => {
				const issuesPage = await findIssue(page, projectId, title);
				await removeIssue(issuesPage, title);
			});
		}
	);
});
