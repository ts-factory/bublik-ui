/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { Locator, Page } from '@playwright/test';

import { test } from './support/test';

import { IssuePage } from './pages/issue-page';
import { IssuesPage } from './pages/issues-page';
import { ResultStamps } from './pages/result-stamps';
import { RunPage } from './pages/run-page';
import { requireCapability } from './support/capabilities';
import { IssueCleanup } from './support/classification';
import { projectIdByName } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import type { Bundle } from './support/manifest.gen';
import {
	claimFailingResult,
	type ClassifiableResult
} from './support/sample-cases';
import {
	seededClassification,
	type SeededClassification,
	type SeededIssue,
	type SeededPin,
	type SeededRule
} from './support/seeded-classification';

const SEEDED = { tag: ['@run', '@issues', '@needs-classification'] };
const WRITE = { tag: ['@run', '@issues', '@issues-write', '@needs-nok'] };

/** A pin in one of the runs imported after the rules over it were written. */
interface TwinPin {
	pin: SeededPin;
	twin: Bundle;
	runId: number;
	/** Packages, then the test. */
	path: string[];
	/** Every seeded rule written against the pin. */
	rules: SeededRule[];
}

/**
 * Whether a seeded rule should stamp the pin's results in a run imported
 * after it. Only an active rule does — not one-off, not deactivated, not under
 * a closed issue. A rule that matches on run tags captured its seeded run's
 * tags, `fixture_id` among them, which no other run carries, so it never
 * reaches a twin.
 */
function stampsTwin(rule: SeededRule): boolean {
	return rule.active && !rule.match.includes('tags');
}

/** Every (pin, applies-to run) pair the seed recorded. */
function twinPins(seeded: SeededClassification): TwinPin[] {
	const pairs = seeded.pins.flatMap((pin) =>
		pin.appliesTo.map((twin) => {
			const pinned = requireCapability(
				twin.pinnedResults?.find((result) => result.pin === pin.planId),
				`run "${twin.id}" lists no pinned result of pin "${pin.planId}"`
			);

			return {
				pin,
				twin,
				runId: requireCapability(
					twin.runId,
					`run "${twin.id}" has no runId: it was not imported`
				),
				path: pinned.pathStr.split('/'),
				rules: seeded.rules.filter((rule) => rule.pin === pin.planId)
			};
		})
	);

	return requireCapability(
		pairs.length > 0 ? pairs : null,
		'no seeded pin lists a run imported after its rules'
	);
}

/** The pairs grouped by run, so each run page is opened once. */
function byRun(pairs: readonly TwinPin[]): TwinPin[][] {
	const runs = new Map<number, TwinPin[]>();
	for (const pair of pairs) {
		runs.set(pair.runId, [...(runs.get(pair.runId) ?? []), pair]);
	}

	return [...runs.values()];
}

/** The distinct issues of `rules`, in plan order. */
function issuesOf(
	seeded: SeededClassification,
	rules: readonly SeededRule[]
): SeededIssue[] {
	return [...new Set(rules.map((rule) => rule.issue))].map((planId) =>
		seeded.issue(planId)
	);
}

/** The pairs whose pin sits under an active rule, grouped by run. */
function stampedRuns(seeded: SeededClassification): TwinPin[][] {
	const runs = byRun(
		twinPins(seeded).filter((pair) => pair.rules.some(stampsTwin))
	);

	return requireCapability(
		runs.length > 0 ? runs : null,
		'no applies-to run has a pin under an active seeded rule'
	);
}

/** Opens the run of `pairs` and the results of each pin's test in it. */
async function openTwinTables(
	page: Page,
	pairs: readonly TwinPin[]
): Promise<Map<TwinPin, Locator>> {
	const runPage = new RunPage(page);
	const stamps = new ResultStamps(page);
	const tables = new Map<TwinPin, Locator>();

	await runPage.goto(pairs[0].runId);
	await runPage.expectLoaded(pairs[0].twin.expectedRuns[0].name);
	for (const pair of pairs) {
		tables.set(pair, await stamps.openTestResults(pair.path));
	}

	return tables;
}

/** The result table `openTwinTables` opened for `pair`. */
function tableOf(
	tables: ReadonlyMap<TwinPin, Locator>,
	pair: TwinPin
): Locator {
	return requireCapability(
		tables.get(pair),
		`the results of pin "${pair.pin.planId}" were not opened`
	);
}

/**
 * The issues over the pair's pin that `keep` picks and the seed left unable
 * to stamp anything: none of their rules is active.
 */
function silentIssues(
	seeded: SeededClassification,
	pair: TwinPin,
	keep: (issue: SeededIssue) => boolean
): SeededIssue[] {
	return issuesOf(seeded, pair.rules).filter(
		(issue) => keep(issue) && !issue.rules.some(stampsTwin)
	);
}

interface SilentCase {
	/** Picks the issues over a pin that must not stamp its applies-to run. */
	pick: (seeded: SeededClassification, pair: TwinPin) => SeededIssue[];
	/** Why the picked issues cannot carry the scenario, or null when they can. */
	missing: (issues: SeededIssue[]) => string | null;
	steps: { given: string; when: string; then: string };
}

/** Checks that no issue `pick` names over a pin stamps its test in an applies-to run. */
async function expectSilentIssues(page: Page, scenario: SilentCase) {
	const stamps = new ResultStamps(page);
	let runs: TwinPin[][] = [];
	let silent = new Map<TwinPin, SeededIssue[]>();

	await given(scenario.steps.given, () => {
		const seeded = seededClassification(requireManifest());
		const picked = twinPins(seeded)
			.map((pair) => [pair, scenario.pick(seeded, pair)] as const)
			.filter(([, issues]) => issues.length > 0);
		const missing = scenario.missing(picked.flatMap(([, issues]) => issues));
		requireCapability(missing === null, missing ?? '');
		silent = new Map(picked);
		runs = byRun(picked.map(([pair]) => pair));
	});
	for (const pairs of runs) {
		let tables = new Map<TwinPin, Locator>();

		await when(scenario.steps.when, async () => {
			tables = await openTwinTables(page, pairs);
		});
		await then(scenario.steps.then, async () => {
			for (const pair of pairs) {
				for (const issue of silent.get(pair) ?? []) {
					await stamps.expectNotStamped(tableOf(tables, pair), issue.issueId);
				}
			}
		});
	}
}

const issueCleanup = new IssueCleanup('stamps');

test.describe('Rules stamp runs imported after them', () => {
	test.afterEach(async ({ page }, testInfo) => {
		if (testInfo.tags.includes('@issues-write')) {
			await issueCleanup.sweep(page.request);
		}
	});

	test(
		"Every active seeded rule stamps its pin's results in the run imported after it",
		SEEDED,
		async ({ page }) => {
			test.slow();
			const stamps = new ResultStamps(page);
			let seeded!: SeededClassification;
			let runs: TwinPin[][] = [];

			await given(
				'the seed wrote active rules of open issues over pins of a run imported later',
				() => {
					seeded = seededClassification(requireManifest());
					runs = stampedRuns(seeded);
				}
			);
			for (const pairs of runs) {
				let tables = new Map<TwinPin, Locator>();

				await when("I open each pin's test results in that run", async () => {
					tables = await openTwinTables(page, pairs);
				});
				await then(
					"each of those rules' issues stamps the test's results with the rule's category",
					async () => {
						for (const pair of pairs) {
							for (const rule of pair.rules.filter(stampsTwin)) {
								await stamps.expectStamped(
									tableOf(tables, pair),
									seeded.issue(rule.issue).issueId,
									rule.category
								);
							}
						}
					}
				);
			}
		}
	);

	test(
		'Stamps laid when the run was imported name the Import origin',
		SEEDED,
		async ({ page }) => {
			test.slow();
			const stamps = new ResultStamps(page);
			let seeded!: SeededClassification;
			let runs: TwinPin[][] = [];

			await given(
				'the seed wrote active rules of open issues over pins of a run imported later',
				() => {
					seeded = seededClassification(requireManifest());
					runs = stampedRuns(seeded);
				}
			);
			for (const pairs of runs) {
				let tables = new Map<TwinPin, Locator>();

				await when("I open each pin's test results in that run", async () => {
					tables = await openTwinTables(page, pairs);
				});
				await then(
					"each of those issues' stamps says it was laid on import",
					async () => {
						for (const pair of pairs) {
							const table = tableOf(tables, pair);
							const issues = issuesOf(seeded, pair.rules.filter(stampsTwin));
							for (const issue of issues) {
								await stamps.expectOrigin(
									stamps.stampsOf(table, issue.issueId).first(),
									issue.title,
									'import'
								);
							}
						}
					}
				);
			}
		}
	);

	test(
		'A seeded rule that is not active does not stamp the run imported after it',
		SEEDED,
		async ({ page }) => {
			test.slow();
			await expectSilentIssues(page, {
				pick: (seeded, pair) =>
					silentIssues(seeded, pair, (issue) => issue.state === 'open'),
				missing: (issues) =>
					issues.some((issue) =>
						issue.rules.some((rule) => rule.scope === 'oneoff')
					)
						? null
						: 'no open issue with only a one-off rule sits over a pin of an applies-to run',
				steps: {
					given:
						'the seed wrote one-off and deactivated rules of open issues over pins of a run imported later',
					when: "I open each pin's test results in that run",
					then: "none of those rules' issues stamps the test's results"
				}
			});
		}
	);

	test(
		'A closed seeded issue does not stamp the run imported after it',
		SEEDED,
		async ({ page }) => {
			test.slow();
			await expectSilentIssues(page, {
				pick: (seeded, pair) =>
					silentIssues(seeded, pair, (issue) => issue.state === 'closed'),
				missing: (issues) =>
					issues.length > 0
						? null
						: 'no closed issue sits over a pin of an applies-to run',
				steps: {
					given:
						'the seed closed issues whose rules sit over pins of a run imported later',
					when: "I open each pin's test results in that run",
					then: "none of those issues stamps the test's results"
				}
			});
		}
	);

	test(
		'The unruled pin is untriaged with a Classify button in the run imported after it',
		SEEDED,
		async ({ page }) => {
			const runPage = new RunPage(page);
			const stamps = new ResultStamps(page);
			let pair!: TwinPin;
			let pinned = 0;
			let table!: Locator;

			await given(
				'the seed left a pin of a run imported later without any rule',
				() => {
					const seeded = seededClassification(requireManifest());
					pair = requireCapability(
						twinPins(seeded).find((candidate) => !candidate.rules.length),
						'no pin of an applies-to run is left without rules'
					);
					pinned = (pair.twin.pinnedResults ?? []).filter(
						(result) => result.pin === pair.pin.planId
					).length;
				}
			);
			await when(
				"I open the pin's test results in that run and filter them to the pin's verdict",
				async () => {
					table = tableOf(await openTwinTables(page, [pair]), pair);
					await runPage.ensureToolbarVisible(table);
					await runPage.toggleResultFacetOption(
						table,
						'Verdicts',
						requireCapability(
							pair.pin.verdicts[0],
							`pin "${pair.pin.planId}" has no verdict`
						)
					);
				}
			);
			await then(
				"each of the pin's results has a Classify button and no stamp",
				() => stamps.expectUnstamped(table, pinned)
			);
			await when('I pick Untriaged in the Classification filter', () =>
				runPage.toggleResultFacetOption(table, 'Classification', 'Untriaged')
			);
			await then("the pin's results are all still listed", () =>
				stamps.expectUnstamped(table, pinned)
			);
		}
	);

	test(
		'A result stamped under several issues shows one stamp per issue',
		SEEDED,
		async ({ page }) => {
			const stamps = new ResultStamps(page);
			let seeded!: SeededClassification;
			let pair!: TwinPin;
			let issues: SeededIssue[] = [];
			let result!: Locator;

			await given(
				'the seed wrote rules of several open issues over one pin of a run imported later',
				() => {
					seeded = seededClassification(requireManifest());
					// More rules than issues is what tells one stamp per issue from
					// one per rule, so the pin with the widest gap is preferred.
					const ranked = twinPins(seeded)
						.map((candidate) => {
							const rules = candidate.rules.filter(stampsTwin);

							return {
								candidate,
								gap: rules.length,
								issues: issuesOf(seeded, rules)
							};
						})
						.map((entry) => ({
							...entry,
							gap: entry.gap - entry.issues.length
						}))
						.filter((entry) => entry.issues.length > 1)
						.sort((a, b) => b.gap - a.gap || b.issues.length - a.issues.length);
					const chosen = requireCapability(
						ranked[0],
						'no pin of an applies-to run sits under rules of several open issues'
					);
					pair = chosen.candidate;
					issues = chosen.issues;
				}
			);
			await when("I open the pin's test results in that run", async () => {
				const table = tableOf(await openTwinTables(page, [pair]), pair);
				result = stamps
					.resultsStampedBy(
						table,
						issues.map((issue) => issue.issueId)
					)
					.first();
			});
			await then(
				'a result carries exactly one stamp of each of those issues',
				async () => {
					for (const issue of issues) {
						await stamps.expectSingleStamp(result, issue.issueId);
					}
				}
			);
			await and(
				"each stamp shows the category of every one of its issue's rules over the pin",
				async () => {
					for (const rule of pair.rules.filter(stampsTwin)) {
						await stamps.expectStamped(
							result,
							seeded.issue(rule.issue).issueId,
							rule.category
						);
					}
				}
			);
		}
	);

	test(
		"A result stamped by one issue's rules of different origins says so in its tooltip",
		WRITE,
		async ({ page, request }) => {
			const title = issueCleanup.title('origins');
			const runPage = new RunPage(page);
			const stamps = new ResultStamps(page);
			let failing!: ClassifiableResult;
			let result!: Locator;
			let issueId = 0;

			await given('I record an issue for the fixture project', async () => {
				failing = await claimFailingResult(request, 'stamps origins');
				const projectId = requireCapability(
					await projectIdByName(request, failing.run.bundle.project),
					`Project "${failing.run.bundle.project}" is not registered.`
				);
				const issuesPage = new IssuesPage(page);
				await issuesPage.goto({ project: String(projectId) });
				await issuesPage.expectLoaded();
				issueId = await issuesPage.createIssue({ title });
				issueCleanup.register(issueId, projectId);
			});
			await and(
				'I classify a failing result of the fixture run under that issue for future runs',
				async () => {
					// The result this scenario leased, which no other write
					// scenario classifies while it holds it.
					await runPage.goto(failing.runId);
					await runPage.expectLoaded(failing.run.expectedRun.name);
					const table = await stamps.openTestResults(failing.path);
					result = runPage.resultCellOf(table, failing.resultId);

					const drawer = await stamps.openClassify(result);
					await drawer.setMode('Existing issue');
					await drawer.pickIssue(title);
					await drawer.setCategory('Known');
					await drawer.submit();
				}
			);
			await when(
				'I classify the same result under that issue again for this result only',
				async () => {
					const drawer = await stamps.openClassify(result);
					await drawer.setMode('Existing issue');
					await drawer.pickIssue(title);
					await drawer.setCategory('Known');
					await drawer.setScope('Just this result');
					await drawer.submit();
				}
			);
			await then('the result still carries a single stamp of that issue', () =>
				stamps.expectSingleStamp(result, issueId)
			);
			await and(
				'its tooltip says several rules stamped it, by hand and one-off',
				() =>
					stamps.expectOrigins(stamps.stampsOf(result, issueId), title, [
						'manual_persistent',
						'manual_oneoff'
					])
			);
			await and('I delete the issue', async () => {
				const issuePage = new IssuePage(page);
				await issuePage.goto(issueId);
				await issuePage.expectLoaded(title);
				await issuePage.deleteIssue(title);
				issueCleanup.forget(issueId);
			});
		}
	);
});
