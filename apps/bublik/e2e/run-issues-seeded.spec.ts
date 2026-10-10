/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';

import type { IssueDrawer } from './pages/issue-drawer';
import { RunIssuesPage } from './pages/run-issues-page';
import { requireCapability } from './support/capabilities';
import { CATEGORY_BADGE } from './support/classification';
import type { IssueCategory, RunIssueEffect } from './support/classification';
import { and, given, then, when } from './support/gherkin';
import type { Bundle } from './support/manifest.gen';
import { requireManifest } from './support/manifest';
import {
	seededClassification,
	type SeededClassification,
	type SeededIssue,
	type SeededRule
} from './support/seeded-classification';

const SEEDED = { tag: ['@issues', '@needs-classification'] };

/** Small enough that the busiest seeded run spans several pages. */
const PAGE_SIZE = 10;

/** When an issue's rules disagree, the run shows the strongest effect first. */
const EFFECT_PRECEDENCE: readonly RunIssueEffect[] = [
	'suppressed',
	'stale',
	'unexpected',
	'marked'
];

interface SeededRunIssue {
	issue: SeededIssue;
	/** The issue's rules that classified a result of this run. */
	rules: SeededRule[];
	/** What the run issues row shows: the strongest of those rules' effects. */
	effect: RunIssueEffect;
}

interface SeededRun {
	bundle: Bundle;
	runId: number;
	issues: SeededRunIssue[];
}

function strongestEffect(rules: readonly SeededRule[]): RunIssueEffect {
	return requireCapability(
		EFFECT_PRECEDENCE.find((effect) =>
			rules.some((rule) => rule.effect === effect)
		),
		'a seeded run issue has no rules'
	);
}

/**
 * The seeded run the seed classified the most issues in: the classify call
 * that wrote each rule stamped a result of that rule's `classifiedIn` bundle,
 * and no other.
 */
function busiestSeededRun(seeded: SeededClassification): SeededRun {
	const runs = new Map<string, SeededRun>();

	for (const issue of seeded.issues) {
		const byBundle = new Map<string, { bundle: Bundle; rules: SeededRule[] }>();
		for (const rule of issue.rules) {
			const bundle = rule.classifiedIn;
			const entry = byBundle.get(bundle.id) ?? { bundle, rules: [] };
			entry.rules.push(rule);
			byBundle.set(bundle.id, entry);
		}
		for (const { bundle, rules } of byBundle.values()) {
			const run = runs.get(bundle.id) ?? {
				bundle,
				runId: requireCapability(
					bundle.runId,
					`seeded bundle "${bundle.id}" has no run id`
				),
				issues: []
			};
			run.issues.push({ issue, rules, effect: strongestEffect(rules) });
			runs.set(bundle.id, run);
		}
	}

	return requireCapability(
		[...runs.values()].sort((a, b) => b.issues.length - a.issues.length)[0],
		'the seed classified no result of any run'
	);
}

/**
 * The category the fewest of the run's seeded issues carry a rule of, so the
 * Category filter has issues to keep and issues to drop.
 */
function leastUsedCategory(run: SeededRun): IssueCategory | undefined {
	const counts = new Map<IssueCategory, number>();
	for (const { rules } of run.issues) {
		for (const category of new Set(rules.map((rule) => rule.category))) {
			counts.set(category, (counts.get(category) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.filter(([, count]) => count < run.issues.length)
		.sort(([a, x], [b, y]) => x - y || a.localeCompare(b))[0]?.[0];
}

/** `ref://TRACKER/KEY`, as the seed stores a bug key, into the drawer's two fields. */
function splitBugKey(stored: string): { tracker: string; key: string } {
	const match = requireCapability(
		/^ref:\/\/([^/]+)\/(.+)$/.exec(stored),
		`bug key "${stored}" is not in ref://TRACKER/KEY form`
	);

	return { tracker: match[1], key: match[2] };
}

interface StampedResult {
	entry: SeededRunIssue;
	resultId: number;
	test: string;
	/** The packages above the test, as the results sub-table names them. */
	packagePath: string;
	verdicts: string[];
}

/**
 * A result the seed classified in `run`, with where its pin sits in the run's
 * package tree: the first seeded issue whose pin has a package path and a
 * verdict to show.
 */
function stampedResult(run: SeededRun): StampedResult {
	const seeded = seededClassification(requireManifest());
	const pinned = run.bundle.pinnedResults ?? [];

	for (const entry of run.issues) {
		for (const rule of entry.rules) {
			const pin = seeded.pin(rule.pin);
			const resultId = rule.classifiedResultIds[0];
			const path = pinned.find((result) => result.pin === pin.planId)?.pathStr;
			const packagePath = path?.endsWith(`/${pin.test}`)
				? path.slice(0, -pin.test.length - 1)
				: '';

			if (resultId && packagePath && pin.verdicts.length > 0) {
				return {
					entry,
					resultId,
					test: pin.test,
					packagePath,
					verdicts: pin.verdicts
				};
			}
		}
	}

	return requireCapability(
		undefined,
		`no seeded result of run ${run.runId} has a package path and a verdict`
	);
}

function seededRun(): SeededRun {
	return busiestSeededRun(seededClassification(requireManifest()));
}

/** The busiest seeded run, provided it carries more than one page of issues. */
function seededPagedRun(): SeededRun {
	const run = seededRun();
	requireCapability(
		run.issues.length > 2 * PAGE_SIZE,
		`run ${run.runId} carries ${run.issues.length} seeded issues, not more than two pages of ${PAGE_SIZE}`
	);

	return run;
}

test.describe('Run Issues Page against seeded classification', () => {
	test(
		'Every seeded issue of a run shows its effect on the run',
		SEEDED,
		async ({ page }) => {
			const runIssuesPage = new RunIssuesPage(page);
			let run!: SeededRun;

			await given(
				'the seed classified results of a run under issues with every effect',
				() => {
					run = seededRun();
					for (const effect of EFFECT_PRECEDENCE) {
						requireCapability(
							run.issues.some((entry) => entry.effect === effect),
							`no seeded issue of run ${run.runId} has the "${effect}" effect`
						);
					}
				}
			);
			await when("I open the run's issues page", async () => {
				await runIssuesPage.goto(run.runId, { pageSize: '100' });
				await runIssuesPage.expectLoaded();
			});
			await then(
				'each of those issues shows the effect badge and stripe of its strongest rule',
				async () => {
					for (const { issue, effect } of run.issues) {
						await runIssuesPage.expectIssueEffect(issue.issueId, effect);
					}
				}
			);
		}
	);

	test(
		'An issue whose rules disagree shows the strongest effect on the run',
		SEEDED,
		async ({ page }) => {
			const runIssuesPage = new RunIssuesPage(page);
			let run!: SeededRun;
			let disagreeing!: SeededRunIssue;

			await given(
				'the seed classified a result of a run under an issue whose rules have different effects',
				() => {
					run = seededRun();
					const candidates = run.issues.filter(
						({ rules }) => new Set(rules.map((rule) => rule.effect)).size > 1
					);
					// Prefer an issue whose first rule is the weaker one, so the
					// row cannot pass by showing whichever rule came first.
					disagreeing = requireCapability(
						candidates.find(
							({ rules, effect }) => rules[0].effect !== effect
						) ?? candidates[0],
						`no seeded issue of run ${run.runId} has rules with different effects`
					);
				}
			);
			await when("I open the run's issues page", async () => {
				await runIssuesPage.goto(run.runId, { pageSize: '100' });
				await runIssuesPage.expectLoaded();
			});
			await then('the issue shows the strongest of those effects', () =>
				runIssuesPage.expectIssueEffect(
					disagreeing.issue.issueId,
					disagreeing.effect
				)
			);
			await and('it lists the category of every one of its rules', () =>
				runIssuesPage.expectIssueCategories(
					disagreeing.issue.issueId,
					disagreeing.rules.map((rule) => rule.category)
				)
			);
		}
	);

	test(
		"The State and Category filters narrow a run's seeded issues",
		{ tag: [...SEEDED.tag, '@url-params'] },
		async ({ page }) => {
			const runIssuesPage = new RunIssuesPage(page);
			let run!: SeededRun;
			let category!: IssueCategory;

			await given(
				'the seed classified results of a run under open and closed issues of several categories',
				() => {
					run = seededRun();
					requireCapability(
						run.issues.some(({ issue }) => issue.state === 'closed') &&
							run.issues.some(({ issue }) => issue.state === 'open'),
						`run ${run.runId} carries no mix of open and closed seeded issues`
					);
					category = requireCapability(
						leastUsedCategory(run),
						`run ${run.runId} carries seeded issues of a single category`
					);
				}
			);
			await and("I open the run's issues page", async () => {
				await runIssuesPage.goto(run.runId, { pageSize: '100' });
				await runIssuesPage.expectLoaded();
			});
			await when('I pick Closed in the State filter', () =>
				runIssuesPage.table.toggleFacet('State', 'Closed')
			);
			await then('the state is written to the URL', () =>
				runIssuesPage.expectParams({ state: 'closed' })
			);
			await and('only the closed seeded issues of the run are listed', () =>
				runIssuesPage.expectOnlyListed(
					run.issues.map(({ issue }) => issue.issueId),
					run.issues
						.filter(({ issue }) => issue.state === 'closed')
						.map(({ issue }) => issue.issueId)
				)
			);
			await when('I reset the filters', async () => {
				await runIssuesPage.table.reset();
				await runIssuesPage.expectParams({ state: null });
			});
			await and(
				'I pick the least used seeded category in the Category filter',
				() =>
					runIssuesPage.table.toggleFacet('Category', CATEGORY_BADGE[category])
			);
			await then('the category is written to the URL', () =>
				runIssuesPage.expectParams({ categories: category })
			);
			await and(
				'only the seeded issues with a rule of that category are listed',
				() =>
					runIssuesPage.expectOnlyListed(
						run.issues.map(({ issue }) => issue.issueId),
						run.issues
							.filter(({ rules }) =>
								rules.some((rule) => rule.category === category)
							)
							.map(({ issue }) => issue.issueId)
					)
			);
		}
	);

	test(
		"A run's seeded issues page through ten at a time",
		{ tag: [...SEEDED.tag, '@url-params'] },
		async ({ page }) => {
			const runIssuesPage = new RunIssuesPage(page);
			let run!: SeededRun;
			const seen: number[] = [];

			await given(
				'the seed classified results of a run under more issues than one page of ten holds',
				() => {
					run = seededPagedRun();
				}
			);
			await when(
				"I open the run's issues page ten issues at a time",
				async () => {
					await runIssuesPage.goto(run.runId, { pageSize: String(PAGE_SIZE) });
					await runIssuesPage.expectLoaded();
					await runIssuesPage.expectOnPage(1);
				}
			);
			await then('the first page lists ten issues', async () => {
				await runIssuesPage.expectRowCount(PAGE_SIZE);
				seen.push(...(await runIssuesPage.listedIssueIds()));
			});
			let lastPage = 1;
			await when('I page forward until the last page', async () => {
				while (await runIssuesPage.hasNextPage()) {
					lastPage += 1;
					await runIssuesPage.openNextPage(lastPage);
					seen.push(...(await runIssuesPage.listedIssueIds()));
				}
			});
			await then('the page is written to the URL', () =>
				runIssuesPage.expectParams({
					page: String(lastPage),
					pageSize: String(PAGE_SIZE)
				})
			);
			await and(
				'every seeded issue of the run was listed on exactly one page',
				() => {
					for (const { issue } of run.issues) {
						expect(
							seen.filter((issueId) => issueId === issue.issueId),
							`seeded issue "${issue.planId}" across the pages`
						).toHaveLength(1);
					}
				}
			);
		}
	);

	test(
		'The run issues footer counts the rows of the page it shows',
		SEEDED,
		async ({ page }) => {
			const runIssuesPage = new RunIssuesPage(page);
			let run!: SeededRun;

			await given(
				'the seed classified results of a run under more issues than one page of ten holds',
				() => {
					run = seededPagedRun();
				}
			);
			await when(
				"I open the run's issues page ten issues at a time",
				async () => {
					await runIssuesPage.goto(run.runId, { pageSize: String(PAGE_SIZE) });
					await runIssuesPage.expectLoaded();
					await runIssuesPage.expectOnPage(1);
				}
			);
			await then("the footer reads one to ten of all the run's issues", () =>
				runIssuesPage.expectFooterRange(1, PAGE_SIZE, run.issues.length)
			);
			await when('I open the second page', () => runIssuesPage.openNextPage(2));
			await then(
				"the footer reads eleven to twenty of all the run's issues",
				() =>
					runIssuesPage.expectFooterRange(
						PAGE_SIZE + 1,
						2 * PAGE_SIZE,
						run.issues.length
					)
			);
		}
	);

	test(
		'Editing a seeded issue from its run issues row loads the whole issue',
		SEEDED,
		async ({ page }) => {
			const runIssuesPage = new RunIssuesPage(page);
			let run!: SeededRun;
			let entry!: SeededRunIssue;
			let drawer!: IssueDrawer;

			await given(
				'the seed classified a result of a run under an open issue with a bug key and a description',
				() => {
					run = seededRun();
					entry = requireCapability(
						run.issues.find(
							({ issue }) =>
								issue.state === 'open' && issue.key && issue.description?.trim()
						),
						`no open seeded issue of run ${run.runId} has a bug key and a description`
					);
				}
			);
			await and("I open the run's issues page", async () => {
				await runIssuesPage.goto(run.runId, { pageSize: '100' });
				await runIssuesPage.expectLoaded();
			});
			await when('I edit the issue from its row', async () => {
				drawer = await runIssuesPage.openEdit(
					runIssuesPage.rowById(entry.issue.issueId)
				);
			});
			await then(
				"the drawer holds the issue's title, description, tracker, bug key and state",
				() => {
					const { tracker, key } = splitBugKey(entry.issue.key ?? '');

					return drawer.expectValues({
						title: entry.issue.title,
						// The server stores the description trimmed.
						description: entry.issue.description?.trim() ?? '',
						tracker,
						bugKey: key,
						state: 'Open'
					});
				}
			);
			await when('I cancel the edit', () => drawer.cancel());
			await then('the issue is still listed with its effect on the run', () =>
				runIssuesPage.expectIssueEffect(entry.issue.issueId, entry.effect)
			);
		}
	);

	test(
		'The expanded results of a seeded issue show the test, its package and its verdicts',
		SEEDED,
		async ({ page }) => {
			const runIssuesPage = new RunIssuesPage(page);
			let run!: SeededRun;
			let stamped!: StampedResult;

			await given(
				'the seed classified a result of a run under an issue',
				() => {
					run = seededRun();
					stamped = stampedResult(run);
				}
			);
			await and("I open the run's issues page", async () => {
				await runIssuesPage.goto(run.runId, { pageSize: '100' });
				await runIssuesPage.expectLoaded();
			});
			await when("I expand the issue's results", () =>
				runIssuesPage.expandResults(
					runIssuesPage.rowById(stamped.entry.issue.issueId)
				)
			);
			await then(
				'the classified result is listed with its test name and package path',
				() =>
					runIssuesPage.expectResultTest(stamped.resultId, {
						name: stamped.test,
						packagePath: stamped.packagePath
					})
			);
			await and('it shows the verdicts the result obtained', () =>
				runIssuesPage.expectResultVerdicts(stamped.resultId, stamped.verdicts)
			);
		}
	);
});
