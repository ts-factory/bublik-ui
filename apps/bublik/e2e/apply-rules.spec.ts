/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import { IssuePage } from './pages/issue-page';
import { IssuesPage } from './pages/issues-page';
import { LogPage } from './pages/log-page';
import { MeasurementsPage } from './pages/measurements-page';
import { ResultStamps } from './pages/result-stamps';
import { RunIssuesPage } from './pages/run-issues-page';
import { RunPage } from './pages/run-page';
import { requireCapability } from './support/capabilities';
import { IssueCleanup } from './support/classification';
import { projectIdByName } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { loneResult } from './support/lone-result';
import { claimClassifiableTest, resultsOfRun } from './support/sample-cases';
import type {
	ClassifiableResult,
	ClassifiableRun,
	RunTestResult
} from './support/sample-cases';

const RUN = { tag: ['@issues', '@issues-write', '@needs-nok', '@run'] };

/** Whatever the run's other rules add, the toast reads one of these. */
const ANY_APPLIED = /^Applied — (no new stamps|\d+ stamps? created)$/;
const STAMPS_CREATED = /^Applied — \d+ stamps? created$/;

const cleanup = new IssueCleanup('apply-rules');

/** An issue of this scenario's own, with one rule gated to its leased run. */
interface Recorded {
	run: ClassifiableRun;
	/** The result whose test the rule is written for. */
	target: ClassifiableResult;
	title: string;
	issueId: number;
	projectId: number;
}

/**
 * Leases a whole classifiable run (`claimClassifiableTest()`), so no other
 * write scenario classifies a result in it or applies rules to it meanwhile,
 * and hands back every result of one failing test in it.
 */
async function leaseRun(
	request: APIRequestContext,
	label: string
): Promise<{ run: ClassifiableRun; failing: ClassifiableResult[] }> {
	const { run, results } = await claimClassifiableTest(
		request,
		`apply-rules ${label}`
	);

	return { run, failing: results };
}

/**
 * Records an issue and, from its page, an expected Known rule for `target`'s
 * test, gated to its run's `fixture_id` tag so the rule never stamps another
 * run, and narrowed to `parameters` when given.
 */
async function recordIssueWithRule(
	page: Page,
	request: APIRequestContext,
	label: string,
	run: ClassifiableRun,
	target: ClassifiableResult,
	{
		parameters = [],
		active = true
	}: { parameters?: string[]; active?: boolean } = {}
): Promise<Recorded> {
	const projectId = requireCapability(
		await projectIdByName(request, run.bundle.project),
		`Project "${run.bundle.project}" is not registered.`
	);
	const fixtureId = requireCapability(
		run.bundle.tags['fixture_id'],
		`Run ${run.runId} carries no fixture_id tag to gate a rule on.`
	);
	const title = cleanup.title(label);
	const issuesPage = new IssuesPage(page);

	await issuesPage.goto({ project: String(projectId) });
	await issuesPage.expectLoaded();
	const issueId = await issuesPage.createIssue({ title });
	cleanup.register(issueId, projectId);

	const issuePage = new IssuePage(page);
	await issuePage.goto(issueId, { project: String(projectId) });
	await issuePage.expectLoaded(title);
	await issuePage.expectRulesReady();

	const drawer = await issuePage.openNewRule();
	await drawer.pickTest(target.testName, target.pathStr);
	await drawer.addTags([`fixture_id=${String(fixtureId)}`]);
	if (parameters.length) await drawer.addParameters(parameters);
	await drawer.setCategory('Known');
	await drawer.setDisposition('Expected');
	if (!active) await drawer.setActive(false);
	await drawer.submit();
	await drawer.expectClosed();

	await expectRuleActive(issuePage, active);

	return { run, target, title, issueId, projectId };
}

/** Opens the issue's page, where its single rule is listed. */
async function openIssue(page: Page, recorded: Recorded): Promise<IssuePage> {
	const issuePage = new IssuePage(page);

	await issuePage.goto(recorded.issueId, {
		project: String(recorded.projectId)
	});
	await issuePage.expectLoaded(recorded.title);
	await issuePage.expectRuleListed(issuePage.ruleRows().first());

	return issuePage;
}

/** Turns the issue's only rule on or off from its Edit Rule drawer. */
async function setRuleActive(
	page: Page,
	recorded: Recorded,
	active: boolean
): Promise<void> {
	const issuePage = await openIssue(page, recorded);
	const drawer = await issuePage.editRule(issuePage.ruleRows().first());

	await drawer.setActive(active);
	await drawer.submit();
	await drawer.expectClosed();
	await expectRuleActive(issuePage, active);
}

/** The issue's only rule, just saved, is listed and counted as active or not. */
async function expectRuleActive(
	issuePage: IssuePage,
	active: boolean
): Promise<void> {
	await issuePage.expectRuleActive(issuePage.ruleRows().first(), active);
	await issuePage.expectRulesState(
		active ? 'enforced' : 'dormant',
		active ? '1 of 1 rules active' : '0 of 1 rules active'
	);
}

async function applyFromRunPage(page: Page, run: ClassifiableRun) {
	const runPage = new RunPage(page);

	await runPage.goto(run.runId);
	await runPage.expectLoaded(run.expectedRun.name);

	return runPage.applyRules();
}

/** Opens the run page, and on it the results of the rule's test. */
async function openTestResults(
	page: Page,
	recorded: Recorded
): Promise<Locator> {
	const runPage = new RunPage(page);

	await runPage.goto(recorded.run.runId);
	await runPage.expectLoaded(recorded.run.expectedRun.name);

	return new ResultStamps(page).openTestResults(recorded.target.path);
}

async function expectTestStamped(page: Page, recorded: Recorded) {
	const table = await openTestResults(page, recorded);

	await new ResultStamps(page).expectStamped(
		table,
		recorded.issueId,
		'known-issue'
	);

	return table;
}

async function expectTestUnstamped(page: Page, recorded: Recorded) {
	const table = await openTestResults(page, recorded);

	await new ResultStamps(page).expectNotStamped(table, recorded.issueId);
}

async function expectNotOnRunIssues(page: Page, recorded: Recorded) {
	const runIssuesPage = new RunIssuesPage(page);

	await runIssuesPage.goto(recorded.run.runId);
	await runIssuesPage.expectLoaded();
	await runIssuesPage.expectIssueNotListed(recorded.issueId);
}

async function deleteIssue(page: Page, recorded: Recorded): Promise<void> {
	const issuePage = new IssuePage(page);

	await issuePage.goto(recorded.issueId, {
		project: String(recorded.projectId)
	});
	await issuePage.expectLoaded(recorded.title);
	await issuePage.deleteIssue(recorded.title);
	cleanup.forget(recorded.issueId);
}

test.describe('Apply Rules', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await cleanup.sweep(request);
	});

	test(
		'Apply Rules skips a rule that was deactivated',
		RUN,
		async ({ page, request }) => {
			let recorded!: Recorded;
			let applied = '';

			await given(
				'I record an issue with a rule for a failing test of a run of my own, gated to that run',
				async () => {
					const { run, failing } = await leaseRun(request, 'inactive');
					recorded = await recordIssueWithRule(
						page,
						request,
						'inactive',
						run,
						failing[0]
					);
				}
			);
			await and('I deactivate the rule', () =>
				setRuleActive(page, recorded, false)
			);
			await when('I apply the rules to the run from its page', async () => {
				applied = await applyFromRunPage(page, recorded.run);
			});
			await then('the toast reports what was applied', () =>
				expect(applied).toMatch(ANY_APPLIED)
			);
			await and('no result of the test carries a stamp of the issue', () =>
				expectTestUnstamped(page, recorded)
			);
			await and("the run's issues page does not list the issue", () =>
				expectNotOnRunIssues(page, recorded)
			);
			await and('I delete the issue from its page', () =>
				deleteIssue(page, recorded)
			);
		}
	);

	test(
		'Apply Rules skips the rules of a closed issue',
		RUN,
		async ({ page, request }) => {
			let recorded!: Recorded;
			let applied = '';

			await given(
				'I record an issue with a rule for a failing test of a run of my own, gated to that run',
				async () => {
					const { run, failing } = await leaseRun(request, 'closed');
					recorded = await recordIssueWithRule(
						page,
						request,
						'closed',
						run,
						failing[0]
					);
				}
			);
			await and('I close the issue', async () => {
				const issuePage = await openIssue(page, recorded);
				await issuePage.close();
				await issuePage.expectState('closed');
				await issuePage.expectRulesState('deactivated', '0 of 1 rules active');
			});
			await when('I apply the rules to the run from its page', async () => {
				applied = await applyFromRunPage(page, recorded.run);
			});
			await then('the toast reports what was applied', () =>
				expect(applied).toMatch(ANY_APPLIED)
			);
			await and('no result of the test carries a stamp of the issue', () =>
				expectTestUnstamped(page, recorded)
			);
			await and("the run's issues page does not list the issue", () =>
				expectNotOnRunIssues(page, recorded)
			);
			await and('I delete the issue from its page', () =>
				deleteIssue(page, recorded)
			);
		}
	);

	test(
		'A stamp laid by Apply Rules says it was stamped by hand',
		RUN,
		async ({ page, request }) => {
			const stamps = new ResultStamps(page);
			let recorded!: Recorded;
			let applied = '';
			let table!: Locator;

			await given(
				'I record an issue with a rule for a failing test of a run of my own, gated to that run',
				async () => {
					const { run, failing } = await leaseRun(request, 'origin');
					recorded = await recordIssueWithRule(
						page,
						request,
						'origin',
						run,
						failing[0]
					);
				}
			);
			await when('I apply the rules to the run from its page', async () => {
				applied = await applyFromRunPage(page, recorded.run);
			});
			await then('the toast reports how many stamps were created', () =>
				expect(applied).toMatch(STAMPS_CREATED)
			);
			await and("the test's results carry a stamp of the issue", async () => {
				table = await expectTestStamped(page, recorded);
			});
			await and("the stamp's tooltip says it was stamped by hand", () =>
				stamps.expectOrigin(
					stamps.stampsOf(table, recorded.issueId).first(),
					recorded.title,
					'manual_persistent'
				)
			);
			await and('I delete the issue from its page', () =>
				deleteIssue(page, recorded)
			);
		}
	);

	test(
		'Apply Rules stamps the run from the log page',
		{ tag: ['@issues', '@issues-write', '@needs-nok', '@log'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			let recorded!: Recorded;
			let applied = '';

			await given(
				'I record an issue with a rule for a failing test of a run of my own, gated to that run',
				async () => {
					const { run, failing } = await leaseRun(request, 'log');
					recorded = await recordIssueWithRule(
						page,
						request,
						'log',
						run,
						failing[0]
					);
				}
			);
			await when(
				"I open the run's log focused on that test's failing result",
				async () => {
					await logPage.goto(
						recorded.run.runId,
						`mode=treeAndinfoAndlog&focusId=${recorded.target.resultId}`
					);
					await logPage.expectLoaded();
				}
			);
			await and('I apply the rules from the log header', async () => {
				applied = await logPage.applyRules();
			});
			await then('the toast reports how many stamps were created', () =>
				expect(applied).toMatch(STAMPS_CREATED)
			);
			await and(
				"on the run page the test's results carry a stamp of the issue",
				() => expectTestStamped(page, recorded)
			);
			await and('I delete the issue from its page', () =>
				deleteIssue(page, recorded)
			);
		}
	);

	test(
		'Apply Rules stamps the run from the measurements page',
		{ tag: ['@issues', '@issues-write', '@needs-nok', '@measurements'] },
		async ({ page, request }) => {
			const measurementsPage = new MeasurementsPage(page);
			let recorded!: Recorded;
			let applied = '';

			await given(
				'I record an issue with a rule for a failing test with measurements of a run of my own, gated to that run',
				async () => {
					const { run } = await leaseRun(request, 'measurements');
					const measured = requireCapability(
						(await resultsOfRun(request, run))
							.filter((result) => result.hasError && result.hasMeasurements)
							.sort((a, b) => a.resultId - b.resultId)[0],
						`Run ${run.runId} has no failing result with measurements.`
					);
					recorded = await recordIssueWithRule(
						page,
						request,
						'measurements',
						run,
						measured
					);
				}
			);
			await when(
				"I open the measurements page of that test's failing result",
				async () => {
					await measurementsPage.goto(
						recorded.run.runId,
						recorded.target.resultId
					);
					await measurementsPage.expectLoaded();
				}
			);
			await and('I apply the rules from the measurements header', async () => {
				applied = await measurementsPage.applyRules();
			});
			await then('the toast reports how many stamps were created', () =>
				expect(applied).toMatch(STAMPS_CREATED)
			);
			await and(
				"on the run page the test's results carry a stamp of the issue",
				() => expectTestStamped(page, recorded)
			);
			await and('I delete the issue from its page', () =>
				deleteIssue(page, recorded)
			);
		}
	);

	test(
		'A rule that matches a single result reports a single stamp',
		RUN,
		async ({ page, request }) => {
			const stamps = new ResultStamps(page);
			let recorded!: Recorded;
			let applied = '';

			await given(
				'I record an issue with an inactive rule gated to a run of my own, matching one of its results by parameters',
				async () => {
					const { run } = await leaseRun(request, 'single');
					const lone: RunTestResult = requireCapability(
						loneResult(await resultsOfRun(request, run)),
						`No result of run ${run.runId} has parameters only it carries.`
					);
					recorded = await recordIssueWithRule(
						page,
						request,
						'single',
						run,
						lone,
						{ parameters: lone.parameters, active: false }
					);
				}
			);
			// Rules the seed or other scenarios left active may not have reached
			// this run yet; applying them first leaves this scenario's rule the
			// only one with anything left to stamp.
			await and(
				"the run's other active rules are already applied",
				async () => {
					expect(await applyFromRunPage(page, recorded.run)).toMatch(
						ANY_APPLIED
					);
				}
			);
			await when('I activate the rule', () =>
				setRuleActive(page, recorded, true)
			);
			await and('I apply the rules to the run from its page', async () => {
				applied = await applyFromRunPage(page, recorded.run);
			});
			await then('the toast reports exactly one stamp created', () =>
				expect(applied).toBe('Applied — 1 stamp created')
			);
			await and('only that result carries a stamp of the issue', async () => {
				const table = await openTestResults(page, recorded);
				await stamps.expectSingleStamp(table, recorded.issueId);
				await stamps.expectSingleStamp(
					new RunPage(page).resultCellOf(table, recorded.target.resultId),
					recorded.issueId
				);
			});
			await and('I delete the issue from its page', () =>
				deleteIssue(page, recorded)
			);
		}
	);
});
