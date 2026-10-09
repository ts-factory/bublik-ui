/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';
import type { APIRequestContext, Page } from '@playwright/test';

import { IssuePage } from './pages/issue-page';
import { IssueResultsPage } from './pages/issue-results-page';
import { IssuesPage } from './pages/issues-page';
import { ResultStamps } from './pages/result-stamps';
import { RunPage } from './pages/run-page';
import { requireCapability } from './support/capabilities';
import { IssueCleanup } from './support/classification';
import { projectIdByName } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import { classifiableRun } from './support/sample-cases';
import {
	seededClassification,
	type SeededClassification,
	type SeededIssue
} from './support/seeded-classification';

const SEEDED = { tag: ['@issues', '@needs-classification'] };
const SEEDED_URL = { tag: ['@issues', '@needs-classification', '@url-params'] };

/**
 * The largest page the footer offers. The issue's rules stamp every run
 * imported after them, so the results the seed stamped by hand can still sit
 * past it; the page object pages to them.
 */
const WHOLE_PAGE = { pageSize: '100' } as const;

const cleanup = new IssueCleanup('issue-results');

function seeded(): SeededClassification {
	return seededClassification(requireManifest());
}

interface SeededIssueResult {
	resultId: number;
	/** The run the result belongs to: the one the rule's classify call stamped. */
	runId: number;
	/** The verdicts the result obtained, as its pin recorded them. */
	verdicts: string[];
}

/**
 * The results the seed stamped under `issue`: the ones its rules were
 * created by classifying. A result that several rules classified is listed
 * once, with the verdicts of every pin that names it.
 */
function resultsOf(
	plan: SeededClassification,
	issue: SeededIssue
): SeededIssueResult[] {
	const byId = new Map<number, SeededIssueResult>();

	for (const rule of issue.rules) {
		const runId = requireCapability(
			rule.classifiedIn.runId,
			`seeded bundle "${rule.classifiedIn.id}" has no run id`
		);
		const verdicts = plan.pin(rule.pin).verdicts;

		for (const resultId of rule.classifiedResultIds) {
			const entry = byId.get(resultId) ?? { resultId, runId, verdicts: [] };
			entry.verdicts = [...new Set([...entry.verdicts, ...verdicts])];
			byId.set(resultId, entry);
		}
	}

	return [...byId.values()];
}

interface StampedIssue {
	issue: SeededIssue;
	results: SeededIssueResult[];
}

/** The seeded issue the seed stamped the most results under. */
function busiestSeededIssue(plan: SeededClassification): StampedIssue {
	const stamped = plan.issues
		.map((issue) => ({ issue, results: resultsOf(plan, issue) }))
		.filter(({ results }) => results.length > 0)
		.sort((a, b) => b.results.length - a.results.length);

	return requireCapability(
		stamped[0],
		'the seed classified no result under any issue'
	);
}

interface StampedResultCase {
	issue: SeededIssue;
	resultId: number;
	runId: number;
	runName: string;
	test: string;
	/** The packages above the test, as the Test cell names them. */
	packagePath: string;
	/** The packages then the test, as the run page's tree is walked. */
	path: string[];
	verdicts: string[];
}

/**
 * A result the seed classified, with where its pin sits in its run's package
 * tree: the first seeded rule whose pin has a package path and a verdict.
 */
function stampedResultCase(plan: SeededClassification): StampedResultCase {
	for (const rule of plan.rules) {
		const pin = plan.pin(rule.pin);
		const bundle = rule.classifiedIn;
		const pinned = bundle.pinnedResults?.find(
			(result) => result.pin === pin.planId
		);
		const resultId = rule.classifiedResultIds[0];
		const pathStr = pinned?.pathStr;
		const packagePath = pathStr?.endsWith(`/${pin.test}`)
			? pathStr.slice(0, -pin.test.length - 1)
			: '';

		if (resultId && pathStr && packagePath && pin.verdicts.length > 0) {
			return {
				issue: plan.issue(rule.issue),
				resultId,
				runId: requireCapability(
					bundle.runId,
					`seeded bundle "${bundle.id}" has no run id`
				),
				runName: requireCapability(
					bundle.expectedRuns[0]?.name,
					`seeded bundle "${bundle.id}" names no run`
				),
				test: pin.test,
				packagePath,
				path: pathStr.split('/'),
				verdicts: pin.verdicts
			};
		}
	}

	return requireCapability(
		undefined,
		'no seeded result has a package path and a verdict'
	);
}

interface VerdictSplit {
	issue: SeededIssue;
	verdict: string;
	kept: number[];
	dropped: number[];
}

/**
 * A seeded issue and a verdict some of its results obtained and others did
 * not, so the Verdicts filter has results to keep and results to drop. A
 * verdict carrying the filters' own `;` is passed over: the single-valued
 * filters join on it, and that is another scenario's business.
 */
function verdictSplit(plan: SeededClassification): VerdictSplit {
	for (const issue of plan.issues) {
		const results = resultsOf(plan, issue);
		const verdicts = new Set(
			results
				.flatMap((result) => result.verdicts)
				.filter((verdict) => verdict.trim() && !verdict.includes(';'))
		);

		for (const verdict of verdicts) {
			const kept = results
				.filter((result) => result.verdicts.includes(verdict))
				.map((result) => result.resultId);
			const dropped = results
				.filter((result) => !result.verdicts.includes(verdict))
				.map((result) => result.resultId);

			if (kept.length && dropped.length) {
				return { issue, verdict, kept, dropped };
			}
		}
	}

	return requireCapability(
		undefined,
		'no seeded issue has results that obtained different verdicts'
	);
}

async function fixtureProjectId(request: APIRequestContext): Promise<number> {
	const run = requireCapability(
		classifiableRun(requireManifest()),
		'Fixture manifest contains no second NOK run safe to classify.'
	);
	const name = run.bundle.project;

	return requireCapability(
		await projectIdByName(request, name),
		`Project "${name}" is not registered.`
	);
}

async function openResults(
	page: Page,
	issue: SeededIssue,
	params: Record<string, string> = WHOLE_PAGE
): Promise<IssueResultsPage> {
	const resultsPage = new IssueResultsPage(page);

	await resultsPage.goto(issue.issueId, {
		project: String(issue.projectId),
		...params
	});
	await resultsPage.expectLoaded(issue.title);

	return resultsPage;
}

test.describe('Issue Results Page', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await cleanup.sweep(request);
	});

	test(
		'The results page lists every result the seed stamped under an issue',
		{ tag: ['@issues', '@needs-classification', '@smoke'] },
		async ({ page }) => {
			let stamped!: StampedIssue;
			let resultsPage!: IssueResultsPage;

			await given(
				'the seed stamped results under an issue through its rules',
				() => {
					stamped = busiestSeededIssue(seeded());
				}
			);
			await when("I open the issue's results page", async () => {
				resultsPage = await openResults(page, stamped.issue);
			});
			await then(
				'each of those results is listed with a link to the run it belongs to',
				async () => {
					for (const result of stamped.results) {
						await resultsPage.expectResultListed(result.resultId);
						await resultsPage.expectRunLink(result.resultId, result.runId);
					}
				}
			);
			await and('the footer counts at least that many results', () =>
				resultsPage.expectFooterTotalAtLeast(stamped.results.length)
			);
		}
	);

	test(
		'A stamped result on the issue results page names its test and links out',
		SEEDED,
		async ({ page }) => {
			let stamped!: StampedResultCase;
			let resultsPage!: IssueResultsPage;

			await given('a seeded result with a package path and a verdict', () => {
				stamped = stampedResultCase(seeded());
			});
			await when("I open its issue's results page", async () => {
				resultsPage = await openResults(page, stamped.issue);
			});
			await then(
				'the result is listed with its test name and package path',
				() =>
					resultsPage.expectTest(stamped.resultId, {
						name: stamped.test,
						packagePath: stamped.packagePath
					})
			);
			await and('it shows the verdicts the result obtained', () =>
				resultsPage.expectVerdicts(stamped.resultId, stamped.verdicts)
			);
			await and(
				'it links to the run, the log, the history and the preview',
				async () => {
					await resultsPage.expectResultLinks(stamped.resultId);
					await resultsPage.expectRunLink(stamped.resultId, stamped.runId);
				}
			);
		}
	);

	test(
		"The Verdicts filter narrows an issue's results on the server and is written to the URL",
		SEEDED_URL,
		async ({ page }) => {
			let split!: VerdictSplit;
			let resultsPage!: IssueResultsPage;

			await given(
				'a seeded issue whose results obtained different verdicts',
				() => {
					split = verdictSplit(seeded());
				}
			);
			await when(
				"I open the issue's results page and pick one result's verdict in the Verdicts filter",
				async () => {
					resultsPage = await openResults(page, split.issue);
					await resultsPage.toggleFacet('Verdicts', split.verdict);
				}
			);
			await then('the filters are written to the URL', () =>
				resultsPage.expectParamsPresent(['columnFilters'])
			);
			await and(
				'the results with that verdict are listed and the others are gone',
				async () => {
					for (const resultId of split.dropped) {
						await resultsPage.expectResultGone(resultId);
					}
					for (const resultId of split.kept) {
						await resultsPage.expectResultListed(resultId);
					}
				}
			);
			await when('I reset the filters', () => resultsPage.reset());
			await then(
				'the filters are cleared from the URL and every result is listed again',
				async () => {
					await resultsPage.expectParamsAbsent(['columnFilters']);
					for (const resultId of [...split.kept, ...split.dropped]) {
						await resultsPage.expectResultListed(resultId);
					}
				}
			);
		}
	);

	test(
		'The issue results page writes its page size to the URL',
		SEEDED_URL,
		async ({ page }) => {
			let stamped!: StampedIssue;
			let resultsPage!: IssueResultsPage;

			await given('a seeded issue with results', () => {
				stamped = busiestSeededIssue(seeded());
			});
			await when(
				'I open its results page and choose ten results to a page',
				async () => {
					resultsPage = await openResults(page, stamped.issue, {});
					await resultsPage.setRowsPerPage(10);
				}
			);
			await then(
				'the page size is written to the URL and at most ten results are listed',
				async () => {
					await resultsPage.expectParams({ pageSize: '10', page: null });
					await resultsPage.expectRowsPerPage(10);
					await resultsPage.expectRowCountAtMost(10);
				}
			);
			await and('the footer range starts at the first result', async () => {
				const total = await resultsPage.footerTotal();
				await resultsPage.expectFooterRange(1, Math.min(10, total));
			});
		}
	);

	test(
		"The Rules link and the Results button lead between an issue's rules and its results",
		SEEDED,
		async ({ page }) => {
			const issuePage = new IssuePage(page);
			let stamped!: StampedIssue;
			let resultsPage!: IssueResultsPage;

			await given('a seeded issue with rules and results', () => {
				stamped = busiestSeededIssue(seeded());
				requireCapability(
					stamped.issue.rules.length > 0,
					`seeded issue "${stamped.issue.planId}" has no rules`
				);
			});
			await when("I open the issue's results page", async () => {
				resultsPage = await openResults(page, stamped.issue);
			});
			await when('I follow the Rules link in the header', () =>
				resultsPage.openRules()
			);
			await then("the issue's page is open on its rules", async () => {
				await issuePage.expectLoaded(stamped.issue.title);
				await issuePage.expectRulesReady();
			});
			await when('I follow the Results button', () => issuePage.openResults());
			await then("the issue's results page is open again", async () => {
				await resultsPage.expectOpen(stamped.issue.issueId);
				await resultsPage.expectLoaded(stamped.issue.title);
			});
		}
	);

	test(
		"The Results count on the issues page opens the issue's results",
		SEEDED,
		async ({ page }) => {
			const issuesPage = new IssuesPage(page);
			const resultsPage = new IssueResultsPage(page);
			let stamped!: StampedIssue;
			let badgeCount = 0;

			await given('a seeded issue with results', () => {
				stamped = busiestSeededIssue(seeded());
			});
			await when(
				"I open its project's issues page and click the issue's Results count",
				async () => {
					await issuesPage.goto({
						project: String(stamped.issue.projectId),
						pageSize: '100'
					});
					await issuesPage.expectLoaded();
					const badge = issuesPage.resultCount(
						issuesPage.rowById(stamped.issue.issueId)
					);
					await expect(badge).toHaveText(/^\d+$/, { timeout: 30_000 });
					badgeCount = Number((await badge.innerText()).trim());
					await badge.click();
				}
			);
			await then("the issue's results page is open", async () => {
				await resultsPage.expectOpen(stamped.issue.issueId);
				await resultsPage.expectLoaded(stamped.issue.title);
			});
			await and('the footer counts as many results as the badge did', () =>
				expect
					.poll(() => resultsPage.footerTotal(), { timeout: 30_000 })
					.toBe(badgeCount)
			);
		}
	);

	test(
		"A stamp's key on the run page opens the issue's results",
		SEEDED,
		async ({ page }) => {
			const runPage = new RunPage(page);
			const stamps = new ResultStamps(page);
			const resultsPage = new IssueResultsPage(page);
			let stamped!: StampedResultCase;

			await given('a seeded result the seed stamped in a run', () => {
				stamped = stampedResultCase(seeded());
			});
			await when(
				"I open the run, the test's results, and follow the stamp's key",
				async () => {
					await runPage.goto(stamped.runId);
					await runPage.expectLoaded(stamped.runName);
					const table = await stamps.openTestResults(stamped.path);
					const stamp = stamps.stampsOf(table, stamped.issue.issueId).first();
					await expect(stamp).toBeAttached({ timeout: 30_000 });
					await stamp.getByTestId('issue-key-link').click();
				}
			);
			await then("the issue's results page is open", async () => {
				await resultsPage.expectOpen(stamped.issue.issueId);
				await resultsPage.expectLoaded(stamped.issue.title);
			});
		}
	);

	test(
		'A freshly recorded issue has no results yet',
		{ tag: ['@issues', '@issues-write'] },
		async ({ page, request }) => {
			const issuesPage = new IssuesPage(page);
			const resultsPage = new IssueResultsPage(page);
			const title = cleanup.title('no-results');
			let projectId = 0;
			let issueId = 0;

			await given('I record an issue', async () => {
				projectId = await fixtureProjectId(request);
				await issuesPage.goto({ project: String(projectId) });
				await issuesPage.expectLoaded();
				issueId = await issuesPage.createIssue({ title });
				cleanup.register(issueId, projectId);
			});
			await when('I open its results page', async () => {
				await resultsPage.goto(issueId, { project: String(projectId) });
				await resultsPage.expectLoaded(title);
			});
			await then('it says nothing is classified under the issue yet', () =>
				resultsPage.expectEmpty()
			);
			await and('the footer counts no results', () =>
				resultsPage.expectNoResultsInFooter()
			);
			await and('I delete the issue from its results page', async () => {
				await resultsPage.deleteIssue(title);
				cleanup.forget(issueId);
			});
		}
	);

	test(
		'An invalid issue id on the results page shows the no-data state',
		{ tag: ['@issues'] },
		async ({ page }) => {
			const resultsPage = new IssueResultsPage(page);

			await when(
				'I open the issue results page with an id that is not a number',
				() => resultsPage.goto('not-a-number')
			);
			await then('I am told the issue id is missing or invalid', () =>
				resultsPage.expectInvalidId()
			);
		}
	);
});
