/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { IssuePage } from './pages/issue-page';
import { IssuesPage } from './pages/issues-page';
import { RunIssuesPage } from './pages/run-issues-page';
import { RunPage } from './pages/run-page';
import { IssueCleanup } from './support/classification';
import { and, given, then, when } from './support/gherkin';
import { requireCapability } from './support/capabilities';
import { projectIdByName } from './support/e2e-data';
import {
	claimClassifiableTest,
	claimFailingResult
} from './support/sample-cases';
import type { ClassifiableRun } from './support/sample-cases';

const RUN_ISSUES = { tag: ['@issues', '@issues-write', '@needs-nok'] };

const cleanup = new IssueCleanup('run-issues');

async function fixtureProjectId(
	request: APIRequestContext,
	run: ClassifiableRun
): Promise<number> {
	return requireCapability(
		await projectIdByName(request, run.bundle.project),
		`Project "${run.bundle.project}" is not registered.`
	);
}

interface Classified {
	run: ClassifiableRun;
	title: string;
	projectId: number;
}

/**
 * Opens the run of the failing result this scenario claimed and classifies
 * that result under a fresh issue. Scope stays "future", so a rule is written
 * too; the match scope stays at its default.
 */
async function classifyFailingResult(
	page: Page,
	request: APIRequestContext,
	label: 'suppressed' | 'marked' | 'stale' | 'filters' | 'sidebar',
	disposition: 'Expected' | 'Marked'
): Promise<Classified> {
	const failing = await claimFailingResult(request, `run-issues ${label}`);
	const { run } = failing;
	const projectId = await fixtureProjectId(request, run);
	const runPage = new RunPage(page);
	const title = cleanup.title(label);

	await runPage.goto(run.runId);
	await runPage.expectLoaded(run.expectedRun.name);
	const table = await runPage.openResultTableAt(
		failing.path.slice(0, -1),
		failing.testName
	);

	const drawer = await runPage.openClassify(
		table,
		await runPage.resultIndexOf(table, failing.resultId)
	);
	await drawer.fillNewIssue({ title });
	await drawer.setCategory('Known');
	await drawer.setDisposition(disposition);
	await drawer.submit();

	return { run, title, projectId };
}

async function openRunIssues(
	page: Page,
	classified: Classified
): Promise<RunIssuesPage> {
	const runIssuesPage = new RunIssuesPage(page);

	await runIssuesPage.goto(classified.run.runId);
	await runIssuesPage.expectLoaded();

	return runIssuesPage;
}

async function removeIssue(
	runIssuesPage: RunIssuesPage,
	classified: Classified
): Promise<void> {
	await runIssuesPage.table.search(classified.title);
	const row = runIssuesPage.rowByTitle(classified.title);
	await runIssuesPage.table.expectRowListed(row);
	const issueId = Number(await row.getAttribute('data-issue-id'));
	await runIssuesPage.deleteIssue(row, classified.title);
	await runIssuesPage.expectIssueGone(classified.title);
	cleanup.forget(issueId);
}

test.describe('Run Issues Page', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await cleanup.sweep(request);
	});

	test(
		'A suppressed classification is listed on the run issues page with its results',
		{ tag: ['@issues', '@issues-write', '@needs-nok', '@smoke'] },
		async ({ page, request }) => {
			let classified!: Classified;
			let runIssuesPage!: RunIssuesPage;

			await given(
				'I classify a failing result of the fixture run as an expected known issue',
				async () => {
					classified = await classifyFailingResult(
						page,
						request,
						'suppressed',
						'Expected'
					);
				}
			);
			await when("I open the run's issues page", async () => {
				runIssuesPage = await openRunIssues(page, classified);
			});
			await then('the issue is listed as suppressed', async () => {
				await runIssuesPage.expectIssueListed(classified.title);
				await runIssuesPage.expectEffect(classified.title, 'suppressed');
			});
			await when("I expand the issue's results", () =>
				runIssuesPage.expandResults(runIssuesPage.rowByTitle(classified.title))
			);
			await then(
				'at least one result is listed with links to the run, log, history and preview',
				async () => {
					await runIssuesPage.expectResultRowsAtLeast(1);
					await runIssuesPage.expectResultLinks(
						runIssuesPage.resultRows().first()
					);
				}
			);
			await and('I delete the issue from the run issues page', () =>
				removeIssue(runIssuesPage, classified)
			);
		}
	);

	test(
		'An undecided classification still counts and says so',
		RUN_ISSUES,
		async ({ page, request }) => {
			let classified!: Classified;
			let runIssuesPage!: RunIssuesPage;

			await given(
				'I classify a failing result of the fixture run as a marked known issue',
				async () => {
					classified = await classifyFailingResult(
						page,
						request,
						'marked',
						'Marked'
					);
				}
			);
			await when("I open the run's issues page", async () => {
				runIssuesPage = await openRunIssues(page, classified);
			});
			await then('the issue is listed as undecided', () =>
				runIssuesPage.expectEffect(classified.title, 'marked')
			);
			await and('I delete the issue from the run issues page', () =>
				removeIssue(runIssuesPage, classified)
			);
		}
	);

	test(
		'Closing the issue turns a suppressed result into counting again',
		RUN_ISSUES,
		async ({ page, request }) => {
			let classified!: Classified;
			let runIssuesPage!: RunIssuesPage;

			await given(
				'I classify a failing result of the fixture run as an expected known issue',
				async () => {
					classified = await classifyFailingResult(
						page,
						request,
						'stale',
						'Expected'
					);
				}
			);
			await and('I close the issue from its page', async () => {
				const issuesPage = new IssuesPage(page);
				await issuesPage.goto({ project: String(classified.projectId) });
				await issuesPage.expectLoaded();
				await issuesPage.table.search(classified.title);
				await issuesPage.openIssue(classified.title);

				const issuePage = new IssuePage(page);
				await issuePage.expectLoaded(classified.title);
				await issuePage.close();
				await issuePage.expectState('closed');
			});
			await when("I open the run's issues page", async () => {
				runIssuesPage = await openRunIssues(page, classified);
			});
			await then('the issue is listed as counting again', () =>
				runIssuesPage.expectEffect(classified.title, 'stale')
			);
			await and('I delete the issue from the run issues page', () =>
				removeIssue(runIssuesPage, classified)
			);
		}
	);

	test(
		'Run issue filters are written to the URL',
		{ tag: ['@issues', '@issues-write', '@needs-nok', '@url-params'] },
		async ({ page, request }) => {
			let classified!: Classified;
			let runIssuesPage!: RunIssuesPage;

			await given(
				'I classify a failing result of the fixture run as an expected known issue',
				async () => {
					classified = await classifyFailingResult(
						page,
						request,
						'filters',
						'Expected'
					);
				}
			);
			await and("I open the run's issues page", async () => {
				runIssuesPage = await openRunIssues(page, classified);
			});
			await when("I search for the issue's title", () =>
				runIssuesPage.table.search(classified.title)
			);
			await then(
				'the search is written to the URL and the issue is listed',
				async () => {
					await runIssuesPage.expectParams({ q: classified.title, page: null });
					await runIssuesPage.expectIssueListed(classified.title);
				}
			);
			await when('I pick Suppressed in the Effect On Run filter', () =>
				runIssuesPage.table.toggleFacet('Effect On Run', 'Suppressed')
			);
			await then(
				'the effect is written to the URL and the issue is still listed',
				async () => {
					await runIssuesPage.expectParams({ effect: 'suppressed' });
					await runIssuesPage.expectIssueListed(classified.title);
				}
			);
			await when('I search for text no issue carries', () =>
				runIssuesPage.table.search(`${classified.title} nothing-carries-this`)
			);
			await then('no matching issues are shown', () =>
				runIssuesPage.table.expectNoMatching()
			);
			await when('I reset the filters', () => runIssuesPage.table.reset());
			await then('the search and effect are cleared from the URL', () =>
				runIssuesPage.expectParams({ q: null, effect: null })
			);
			await and('I delete the issue from the run issues page', () =>
				removeIssue(runIssuesPage, classified)
			);
		}
	);

	test(
		'Apply Rules stamps the run from a rule written in advance',
		RUN_ISSUES,
		async ({ page, request }) => {
			let run!: ClassifiableRun;
			let classified!: Classified;
			let runIssuesPage!: RunIssuesPage;

			await given(
				'I record an issue with an expected rule for a failing test of the fixture run',
				async () => {
					const claimed = await claimClassifiableTest(
						request,
						'run-issues apply'
					);
					run = claimed.run;
					const [failing] = claimed.results;
					const projectId = await fixtureProjectId(request, run);
					const title = cleanup.title('apply');
					const issuesPage = new IssuesPage(page);

					await issuesPage.goto({ project: String(projectId) });
					await issuesPage.expectLoaded();
					const issueId = await issuesPage.createIssue({ title });
					cleanup.register(issueId, projectId);
					await issuesPage.openIssue(title);

					const issuePage = new IssuePage(page);
					await issuePage.expectLoaded(title);
					await issuePage.expectRulesReady();
					const drawer = await issuePage.openNewRule();
					await drawer.pickTest(failing.testName, failing.pathStr);
					// Gated to this run's tags, so the rule never stamps the run another
					// browser applies its rules to between its two passes.
					const fixtureId = requireCapability(
						run.bundle.tags['fixture_id'],
						`Run ${run.runId} carries no fixture_id tag to gate a rule on.`
					);
					await drawer.addTags([`fixture_id=${String(fixtureId)}`]);
					await drawer.setCategory('Known');
					await drawer.setDisposition('Expected');
					await drawer.submit();
					await drawer.expectClosed();
					await issuePage.expectRulesState('enforced', '1 of 1 rules active');

					classified = { run, title, projectId };
				}
			);
			// From the run page: a run with no issues yet shows the run issues
			// page's empty state, and the Apply Rules button only sits in the
			// toolbar of the table that replaces it.
			const first = await when(
				'I apply the rules to the run from its page',
				async () => {
					const runPage = new RunPage(page);
					await runPage.goto(run.runId);
					await runPage.expectLoaded(run.expectedRun.name);

					return runPage.applyRules();
				}
			);
			await then('the toast reports how many stamps were created', () =>
				expect(first).toMatch(/^Applied — \d+ stamps? created$/)
			);
			await and(
				"the run's issues page lists the issue with at least one result",
				async () => {
					runIssuesPage = await openRunIssues(page, classified);
					await runIssuesPage.table.search(classified.title);
					await runIssuesPage.expectIssueListed(classified.title);
					await runIssuesPage.expectResultCountAtLeast(classified.title, 1);
					await runIssuesPage.expectEffect(classified.title, 'suppressed');
				}
			);
			const second = await when('I apply the rules again from there', () =>
				runIssuesPage.applyRules()
			);
			await then('the toast reports no new stamps', () =>
				expect(second).toBe('Applied — no new stamps')
			);
			await and('I delete the issue from the run issues page', () =>
				removeIssue(runIssuesPage, classified)
			);
		}
	);

	test(
		'The run sidebar counts the issues of the run',
		RUN_ISSUES,
		async ({ page, request }) => {
			const runPage = new RunPage(page);
			let classified!: Classified;

			await given(
				'I classify a failing result of the fixture run as an expected known issue',
				async () => {
					classified = await classifyFailingResult(
						page,
						request,
						'sidebar',
						'Expected'
					);
				}
			);
			await then(
				"the run submenu's Issues item counts at least one issue",
				async () => {
					await expect(
						runPage.runSidebarIssuesLink(classified.run.runId)
					).toBeVisible({ timeout: 30_000 });
					await expect
						.poll(
							async () =>
								Number((await runPage.runSidebarIssueCount.innerText()).trim()),
							{ timeout: 30_000 }
						)
						.toBeGreaterThanOrEqual(1);
				}
			);
			await when('I follow it', () =>
				runPage.runSidebarIssuesLink(classified.run.runId).click()
			);
			await then(
				"the run's issues page is open with the issue listed",
				async () => {
					await expect(page).toHaveURL(
						new RegExp(`/runs/${classified.run.runId}/issues`),
						{ timeout: 15_000 }
					);
					const runIssuesPage = new RunIssuesPage(page);
					await runIssuesPage.expectLoaded();
					await runIssuesPage.expectIssueListed(classified.title);
				}
			);
			await and('I delete the issue from the run issues page', () =>
				removeIssue(new RunIssuesPage(page), classified)
			);
		}
	);
});
