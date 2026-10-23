/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { Locator, Page } from '@playwright/test';

import { expect, test } from './support/test';

import { IssuePage } from './pages/issue-page';
import { IssuesPage } from './pages/issues-page';
import { ResultStamps } from './pages/result-stamps';
import { RunPage } from './pages/run-page';
import { missingRunIdReason, requireCapability } from './support/capabilities';
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
 * a closed issue — and only over a pin of unexpected results, the only ones a
 * rule stamps on import. A rule that matches on run tags captured its seeded
 * run's tags, `fixture_id` among them, which no other run carries, so it never
 * reaches a twin: "A rule gated to the seeded run's tags does not reach a run
 * with other tags" asserts that.
 */
function stampsTwin(seeded: SeededClassification, rule: SeededRule): boolean {
	return (
		seeded.pin(rule.pin).unexpected &&
		rule.active &&
		!rule.match.includes('tags')
	);
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
				runId: requireCapability(twin.runId, missingRunIdReason(twin)),
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
		twinPins(seeded).filter((pair) =>
			pair.rules.some((rule) => stampsTwin(seeded, rule))
		)
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
		(issue) =>
			keep(issue) && !issue.rules.some((rule) => stampsTwin(seeded, rule))
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

/** How many of the pin's results the twin lists: what a rule over it reaches. */
function twinPinRowCount(pair: TwinPin): number {
	return (pair.twin.pinnedResults ?? []).filter(
		(result) => result.pin === pair.pin.planId
	).length;
}

/** The rules of `issue` the seed wrote against `pin`. */
function rulesOver(issue: SeededIssue, pin: SeededPin): SeededRule[] {
	return issue.rules.filter((rule) => rule.pin === pin.planId);
}

/** The pairs of `cases`, grouped by run, each with what the case holds. */
function casesByRun<T extends { pair: TwinPin }>(cases: readonly T[]): T[][] {
	const runs = new Map<number, T[]>();
	for (const entry of cases) {
		runs.set(entry.pair.runId, [...(runs.get(entry.pair.runId) ?? []), entry]);
	}

	return [...runs.values()];
}

/**
 * Opens the run the seed classified `rule`'s results in — the run the rule
 * was written against — and the results of `pin`'s test there.
 */
async function openSeededTable(
	page: Page,
	rule: SeededRule,
	pin: SeededPin
): Promise<Locator> {
	const bundle = rule.classifiedIn;
	const pinned = requireCapability(
		bundle.pinnedResults?.find((result) => result.pin === pin.planId),
		`run "${bundle.id}" lists no pinned result of pin "${pin.planId}"`
	);
	const runPage = new RunPage(page);

	await runPage.goto(
		requireCapability(bundle.runId, missingRunIdReason(bundle))
	);
	await runPage.expectLoaded(bundle.expectedRuns[0].name);

	return new ResultStamps(page).openTestResults(pinned.pathStr.split('/'));
}

/**
 * A pin sharing its test with pins of other verdicts in the same twin, and
 * the issues whose every rule over it keeps the verdicts, so their stamps
 * there are the pin's rows and no other pin's.
 */
interface VerdictCase {
	pair: TwinPin;
	/** The other pins of the test, each with a verdict of its own. */
	others: TwinPin[];
	issues: SeededIssue[];
}

function verdictCases(seeded: SeededClassification): VerdictCase[] {
	const pairs = twinPins(seeded);

	return pairs.flatMap((pair) => {
		const others = pairs.filter(
			(other) =>
				other !== pair &&
				other.runId === pair.runId &&
				other.path.join('/') === pair.path.join('/') &&
				other.pin.verdicts[0] !== pair.pin.verdicts[0]
		);
		if (!others.length) return [];

		const issues = issuesOf(
			seeded,
			pair.rules.filter((rule) => stampsTwin(seeded, rule))
		).filter(
			(issue) =>
				rulesOver(issue, pair.pin).every(
					(rule) => stampsTwin(seeded, rule) && rule.match.includes('verdicts')
				) && others.every((other) => rulesOver(issue, other.pin).length === 0)
		);

		return issues.length ? [{ pair, others, issues }] : [];
	});
}

/**
 * A single-iteration pin and the issues whose every rule over it keeps the
 * parameters and at least one keeps nothing else: the seed classified one
 * result, so such a rule carries all of its parameters and matches that
 * iteration alone.
 */
interface ParameterCase {
	pair: TwinPin;
	issues: SeededIssue[];
}

function parameterCases(seeded: SeededClassification): ParameterCase[] {
	return twinPins(seeded).flatMap((pair) => {
		if (pair.pin.iterations.length !== 1) return [];

		const issues = issuesOf(
			seeded,
			pair.rules.filter((rule) => stampsTwin(seeded, rule))
		).filter((issue) => {
			const own = rulesOver(issue, pair.pin);

			return (
				own.every(
					(rule) =>
						stampsTwin(seeded, rule) && rule.match.includes('parameters')
				) &&
				own.some(
					(rule) => rule.match.length === 1 && rule.match[0] === 'parameters'
				)
			);
		});

		return issues.length ? [{ pair, issues }] : [];
	});
}

/**
 * An active tags rule beside rules of its issue that do stamp the twin, of
 * other categories than its own: the issue's stamp there tells the rules
 * apart by their category badges.
 */
interface TagsCase {
	pair: TwinPin;
	rule: SeededRule;
	issue: SeededIssue;
	/** A sibling rule that stamps the twin, of another category. */
	sibling: SeededRule;
}

function tagsCases(seeded: SeededClassification): TagsCase[] {
	return twinPins(seeded).flatMap((pair) =>
		pair.rules
			.filter((rule) => rule.active && rule.match.includes('tags'))
			.flatMap((rule) => {
				const issue = seeded.issue(rule.issue);
				const siblings = rulesOver(issue, pair.pin).filter((other) =>
					stampsTwin(seeded, other)
				);

				return siblings.length &&
					siblings.every((other) => other.category !== rule.category)
					? [{ pair, rule, issue, sibling: siblings[0] }]
					: [];
			})
	);
}

/** A pin that passes as expected, under rules that are live. */
interface PassingCase {
	pair: TwinPin;
	rules: SeededRule[];
}

function passingCases(seeded: SeededClassification): PassingCase[] {
	return twinPins(seeded).flatMap((pair) => {
		if (pair.pin.unexpected) return [];
		const rules = pair.rules.filter((rule) => rule.active);

		return rules.length ? [{ pair, rules }] : [];
	});
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
							for (const rule of pair.rules.filter((rule) =>
								stampsTwin(seeded, rule)
							)) {
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
							const issues = issuesOf(
								seeded,
								pair.rules.filter((rule) => stampsTwin(seeded, rule))
							);
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
		'The unruled pin is untriaged in the run imported after it',
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
			await then("each of the pin's results is listed without a stamp", () =>
				stamps.expectUnstamped(table, pinned)
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
							const rules = candidate.rules.filter((rule) =>
								stampsTwin(seeded, rule)
							);

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
					for (const rule of pair.rules.filter((rule) =>
						stampsTwin(seeded, rule)
					)) {
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

			// Fills the classify drawer twice over on top of recording the
			// issue, which under a single CI worker on webkit outlasts the
			// default timeout.
			test.slow();
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

	test(
		'A verdict rule stamps only the results that failed with its verdict list',
		SEEDED,
		async ({ page }) => {
			// The test's unfiltered table lists every iteration of it, which for
			// mtu_tcp runs past a hundred rows.
			test.slow();
			const runPage = new RunPage(page);
			const stamps = new ResultStamps(page);
			let runs: VerdictCase[][] = [];

			await given(
				'the seed wrote verdict rules over two pins of one test, each with its own verdict, in a run imported later',
				() => {
					const cases = verdictCases(seededClassification(requireManifest()));
					runs = casesByRun(
						requireCapability(
							cases.length ? cases : null,
							'no test of an applies-to run carries two pins with verdict rules of their own'
						)
					);
				}
			);
			for (const cases of runs) {
				let tables = new Map<TwinPin, Locator>();

				for (const { pair, others, issues } of cases) {
					await when(
						"I open the test's results in that run filtered to one pin's verdict",
						async () => {
							if (!tables.size) {
								tables = await openTwinTables(
									page,
									cases.map((entry) => entry.pair)
								);
							}
							await runPage.toggleResultFacetOption(
								tableOf(tables, pair),
								'Verdicts',
								pair.pin.verdicts[0]
							);
						}
					);
					await then(
						"every listed result carries a stamp of each of that pin's issues",
						async () => {
							const table = tableOf(tables, pair);
							const rows = twinPinRowCount(pair);
							await expect
								.poll(() => runPage.resultRowCount(table), { timeout: 30_000 })
								.toBe(rows);
							for (const issue of issues) {
								await stamps.expectStampCount(table, issue.issueId, rows);
							}
						}
					);
					for (const other of others) {
						await when(
							"I filter them to the other pin's verdict instead",
							async () => {
								await runPage.resetResultFilters(tableOf(tables, pair));
								await runPage.toggleResultFacetOption(
									tableOf(tables, pair),
									'Verdicts',
									other.pin.verdicts[0]
								);
							}
						);
						await then(
							'none of them carries a stamp of those issues',
							async () => {
								const table = tableOf(tables, pair);
								await expect
									.poll(() => runPage.resultRowCount(table), {
										timeout: 30_000
									})
									.toBe(twinPinRowCount(other));
								for (const issue of issues) {
									await stamps.expectNotStamped(table, issue.issueId);
								}
							}
						);
					}
					await runPage.resetResultFilters(tableOf(tables, pair));
				}
			}
		}
	);

	test(
		'A parameters rule stamps only the iteration whose parameters it kept',
		SEEDED,
		async ({ page }) => {
			const runPage = new RunPage(page);
			const stamps = new ResultStamps(page);
			let runs: ParameterCase[][] = [];

			await given(
				'the seed wrote parameters rules over single-iteration pins of a run imported later',
				() => {
					const cases = parameterCases(seededClassification(requireManifest()));
					runs = casesByRun(
						requireCapability(
							cases.length ? cases : null,
							'no single-iteration pin of an applies-to run sits under a parameters-only rule'
						)
					);
				}
			);
			for (const cases of runs) {
				let tables = new Map<TwinPin, Locator>();

				await when("I open each pin's test results in that run", async () => {
					tables = await openTwinTables(
						page,
						cases.map((entry) => entry.pair)
					);
				});
				await then('the test lists more results than the pin has', async () => {
					for (const { pair } of cases) {
						await expect
							.poll(() => runPage.resultRowCount(tableOf(tables, pair)), {
								timeout: 30_000
							})
							.toBeGreaterThan(twinPinRowCount(pair));
					}
				});
				await and(
					"each of those rules' issues stamps exactly the pin's results",
					async () => {
						for (const { pair, issues } of cases) {
							for (const issue of issues) {
								await stamps.expectStampCount(
									tableOf(tables, pair),
									issue.issueId,
									twinPinRowCount(pair)
								);
							}
						}
					}
				);
			}
		}
	);

	test(
		'A rule gated to the seeded run’s tags does not reach a run with other tags',
		SEEDED,
		async ({ page }) => {
			test.slow();
			const stamps = new ResultStamps(page);
			let runs: TagsCase[][] = [];

			await given(
				'the seed wrote a tags rule beside other rules of its issue over a pin of a run imported later',
				() => {
					const cases = tagsCases(seededClassification(requireManifest()));
					runs = casesByRun(
						requireCapability(
							cases.length ? cases : null,
							'no active tags rule shares its pin with a sibling rule of another category that stamps an applies-to run'
						)
					);
				}
			);
			for (const cases of runs) {
				let tables = new Map<TwinPin, Locator>();

				await when("I open the pin's test results in that run", async () => {
					tables = await openTwinTables(
						page,
						cases.map((entry) => entry.pair)
					);
				});
				await then(
					"the issue's stamp shows the other rules' categories but not the tags rule's",
					async () => {
						for (const { pair, rule, issue, sibling } of cases) {
							const table = tableOf(tables, pair);
							await stamps.expectStamped(
								table,
								issue.issueId,
								sibling.category
							);
							await stamps.expectStampWithoutCategory(
								table,
								issue.issueId,
								rule.category
							);
						}
					}
				);
				await and(
					'in the run the rule was written against the stamp shows it',
					async () => {
						for (const { pair, rule, issue } of cases) {
							const table = await openSeededTable(page, rule, pair.pin);
							await stamps.expectStamped(table, issue.issueId, rule.category);
						}
					}
				);
			}
		}
	);

	test(
		'A rule over a result that passed as expected does not stamp it in the run imported after it',
		SEEDED,
		async ({ page }) => {
			const stamps = new ResultStamps(page);
			let seeded!: SeededClassification;
			let runs: PassingCase[][] = [];

			await given(
				'the seed wrote a rule over a pin that passes as expected in a run imported later',
				() => {
					seeded = seededClassification(requireManifest());
					const cases = passingCases(seeded);
					runs = casesByRun(
						requireCapability(
							cases.length ? cases : null,
							'no expected-pass pin of an applies-to run sits under an active rule'
						)
					);
				}
			);
			for (const cases of runs) {
				let tables = new Map<TwinPin, Locator>();

				await when("I open the pin's test results in that run", async () => {
					tables = await openTwinTables(
						page,
						cases.map((entry) => entry.pair)
					);
				});
				await then("the rule's issue stamps none of them", async () => {
					for (const { pair, rules } of cases) {
						for (const rule of rules) {
							await stamps.expectNotStamped(
								tableOf(tables, pair),
								seeded.issue(rule.issue).issueId
							);
						}
					}
				});
				await and(
					"in the run the rule was written against it stamps the pin's result",
					async () => {
						for (const { pair, rules } of cases) {
							for (const rule of rules) {
								const table = await openSeededTable(page, rule, pair.pin);
								await stamps.expectStamped(
									table,
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
});
