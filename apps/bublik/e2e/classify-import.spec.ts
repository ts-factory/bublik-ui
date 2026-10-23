/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import { expect, test } from './support/test';

import { ClassifyDrawer } from './pages/classify-drawer';
import { ImportPage } from './pages/import-page';
import { IssuePage } from './pages/issue-page';
import { IssueRulesPage } from './pages/issue-rules-page';
import { ResultStamps } from './pages/result-stamps';
import { RunPage } from './pages/run-page';
import { missingRunIdReason, requireCapability } from './support/capabilities';
import { IssueCleanup } from './support/classification';
import { projectIdByName } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import type { Bundle } from './support/manifest.gen';
import { claimRun, pinnedResultIds } from './support/sample-cases';
import {
	seededClassification,
	type SeededClassification,
	type SeededPin
} from './support/seeded-classification';

const IMPORT_WRITE = {
	tag: ['@run', '@issues', '@issues-write', '@needs-classification']
};

/** The import of a fixture run, hundreds of iterations, is the long pole. */
const SCENARIO_TIMEOUT_MS = 15 * 60_000;

const cleanup = new IssueCleanup('classify-import');

/**
 * The runs of a scenario: a seeded run of a pin, where the scenario
 * classifies the pin's result, and the run imported after the seed's rules,
 * which the scenario imports again so the rule it wrote gets its turn.
 */
interface ImportCase {
	seeded: SeededClassification;
	pin: SeededPin;
	/** Imported through the API before the rules; the scenario classifies here. */
	source: Bundle;
	/** Imported after the rules, and again by the scenario. */
	twin: Bundle;
	/** Packages, then the pin's test. */
	path: string[];
	projectId: number;
	title: string;
}

/**
 * Picks the runs for `pinId`: the twin is the first run imported after the
 * seed's rules; the source is the latest seeded run of the pin that no rule
 * was written in, so the seeded scenarios reading that one are left alone.
 */
async function importCase(
	request: APIRequestContext,
	pinId: string,
	label: string
): Promise<ImportCase> {
	const seeded = seededClassification(requireManifest());
	const pin = seeded.pin(pinId);
	const twin = requireCapability(
		pin.appliesTo[0],
		`pin "${pinId}" lists no run imported after its rules`
	);
	const writtenIn = new Set(seeded.rules.map((rule) => rule.classifiedIn.id));
	const source = requireCapability(
		pin.seededIn
			.filter((bundle) => bundle.runId && !writtenIn.has(bundle.id))
			.sort((a, b) => b.date.localeCompare(a.date))[0],
		`pin "${pinId}" has no seeded run besides the ones its rules were written in`
	);
	const pinned = requireCapability(
		twin.pinnedResults?.find((record) => record.pin === pinId),
		`run "${twin.id}" lists no pinned result of pin "${pinId}"`
	);
	const projectId = requireCapability(
		await projectIdByName(request, source.project),
		`Project "${source.project}" is not registered.`
	);

	return {
		seeded,
		pin,
		source,
		twin,
		path: pinned.pathStr.split('/'),
		projectId,
		title: cleanup.title(label)
	};
}

/** How many of the pin's results the twin lists. */
function twinRows(scenario: ImportCase): number {
	return (scenario.twin.pinnedResults ?? []).filter(
		(record) => record.pin === scenario.pin.planId
	).length;
}

/** Another pin of the same test in the twin, failing with a verdict of its own. */
function otherVerdictPin(scenario: ImportCase): SeededPin {
	return requireCapability(
		scenario.seeded.pins.find(
			(candidate) =>
				candidate.planId !== scenario.pin.planId &&
				candidate.fixture === scenario.pin.fixture &&
				candidate.test === scenario.pin.test &&
				candidate.verdicts[0] !== scenario.pin.verdicts[0] &&
				candidate.appliesTo.some((bundle) => bundle.id === scenario.twin.id)
		),
		`no other pin of "${scenario.pin.test}" with a verdict of its own lands in run "${scenario.twin.id}"`
	);
}

/** Opens the run page of `bundle` and the results of the pin's test in it. */
async function openTestTable(
	page: Page,
	scenario: ImportCase,
	bundle: Bundle
): Promise<Locator> {
	const runPage = new RunPage(page);

	await runPage.goto(
		requireCapability(bundle.runId, missingRunIdReason(bundle))
	);
	await runPage.expectLoaded(bundle.expectedRuns[0].name);

	return new ResultStamps(page).openTestResults(scenario.path);
}

/** Opens the Classify drawer on the pin's first result in the source run. */
async function openClassifyOnPin(
	page: Page,
	request: APIRequestContext,
	scenario: ImportCase
): Promise<ClassifyDrawer> {
	const [resultId] = await pinnedResultIds(
		request,
		scenario.source,
		scenario.pin.planId
	);
	const table = await openTestTable(page, scenario, scenario.source);
	const stamps = new ResultStamps(page);

	return stamps.openClassify(new RunPage(page).resultCellOf(table, resultId));
}

/** Fills in a new issue titled `title`, lets `narrow` set the scope, and classifies. */
async function classifyUnderNewIssue(
	drawer: ClassifyDrawer,
	scenario: ImportCase,
	title: string,
	narrow: (drawer: ClassifyDrawer) => Promise<void>
): Promise<number> {
	await drawer.fillNewIssue({ title });
	await narrow(drawer);
	const issueId = await drawer.submitForIssueId();
	cleanup.register(issueId, scenario.projectId);

	return issueId;
}

/** Imports the twin again and checks it kept its id. */
async function reimportTwin(page: Page, scenario: ImportCase): Promise<void> {
	const runId = await new ImportPage(page).reimportRun(scenario.twin.importUrl);

	expect(runId).toBe(scenario.twin.runId);
}

/** Opens the twin's test table once the run was imported again. */
async function openTwinTable(
	page: Page,
	scenario: ImportCase
): Promise<Locator> {
	return openTestTable(page, scenario, scenario.twin);
}

async function expectRuleChips(
	page: Page,
	scenario: ImportCase,
	title: string,
	chips: ('Path' | 'Params' | 'Verdicts' | 'Tags')[],
	active: boolean
): Promise<void> {
	const rulesPage = new IssueRulesPage(page);
	const row = rulesPage.rowsByIssue(title);

	await rulesPage.goto({ project: String(scenario.projectId) });
	await rulesPage.expectLoaded();
	await rulesPage.table.search(title);
	await rulesPage.expectRuleListed(row);
	await rulesPage.expectScopeChipsExactly(row, chips);
	await rulesPage.expectRuleActive(row, active);
}

async function deleteIssue(
	page: Page,
	issueId: number,
	title: string
): Promise<void> {
	const issuePage = new IssuePage(page);

	await issuePage.goto(issueId);
	await issuePage.expectLoaded(title);
	await issuePage.deleteIssue(title);
	cleanup.forget(issueId);
}

test.describe('The next import honours the match scope', () => {
	test.beforeEach(() => {
		test.setTimeout(SCENARIO_TIMEOUT_MS);
	});

	test.afterEach(async ({ request }) => {
		await cleanup.sweep(request);
	});

	test(
		"Verdicts kept in the match scope reach the next import's failures with those verdicts only",
		IMPORT_WRITE,
		async ({ page, request }) => {
			const stamps = new ResultStamps(page);
			const runPage = new RunPage(page);
			let scenario!: ImportCase;
			let issueId = 0;
			let table!: Locator;

			await given(
				'I classify a failing result of a seeded run under a new issue keeping only its verdicts for future runs',
				async () => {
					scenario = await importCase(request, 'mtu-tcp-fragment', 'verdicts');
					await claimRun(
						requireCapability(
							scenario.twin.runId,
							missingRunIdReason(scenario.twin)
						),
						`classify-import ${test.info().title}`
					);
					const drawer = await openClassifyOnPin(page, request, scenario);
					issueId = await classifyUnderNewIssue(
						drawer,
						scenario,
						scenario.title,
						async () => {
							await drawer.clearMatch('parameters');
							await drawer.clearMatch('tags');
							await drawer.expectMatch({ verdicts: true });
						}
					);
				}
			);
			await when('the run imported after the rules is imported again', () =>
				reimportTwin(page, scenario)
			);
			await then(
				"exactly the results of that test with those verdicts carry the issue's stamp, laid on import",
				async () => {
					table = await openTwinTable(page, scenario);
					await stamps.expectStampCount(table, issueId, twinRows(scenario));
					await stamps.expectOrigin(
						stamps.stampsOf(table, issueId).first(),
						scenario.title,
						'import'
					);
				}
			);
			await and(
				"the results with the test's other verdict carry none",
				async () => {
					const other = otherVerdictPin(scenario);
					await runPage.toggleResultFacetOption(
						table,
						'Verdicts',
						other.verdicts[0]
					);
					await expect
						.poll(() => runPage.resultRowCount(table), { timeout: 30_000 })
						.toBeGreaterThan(0);
					await stamps.expectNotStamped(table, issueId);
				}
			);
			await and('I delete the issue', () =>
				deleteIssue(page, issueId, scenario.title)
			);
		}
	);

	test(
		"Parameters kept in the match scope reach only the next import's same iteration",
		IMPORT_WRITE,
		async ({ page, request }) => {
			const stamps = new ResultStamps(page);
			const runPage = new RunPage(page);
			let scenario!: ImportCase;
			let issueId = 0;

			await given(
				'I classify a failing result of a seeded run under a new issue keeping only its parameters for future runs',
				async () => {
					scenario = await importCase(
						request,
						'mtu-tcp-fragment',
						'parameters'
					);
					await claimRun(
						requireCapability(
							scenario.twin.runId,
							missingRunIdReason(scenario.twin)
						),
						`classify-import ${test.info().title}`
					);
					const drawer = await openClassifyOnPin(page, request, scenario);
					issueId = await classifyUnderNewIssue(
						drawer,
						scenario,
						scenario.title,
						async () => {
							await drawer.clearMatch('tags');
							await drawer.clearMatch('verdicts');
							await drawer.expectMatch({ parameters: true });
						}
					);
				}
			);
			await when('the run imported after the rules is imported again', () =>
				reimportTwin(page, scenario)
			);
			await then(
				"only the result of the same iteration carries the issue's stamp, laid on import",
				async () => {
					const [resultId] = await pinnedResultIds(
						request,
						scenario.twin,
						scenario.pin.planId
					);
					const table = await openTwinTable(page, scenario);
					await stamps.expectStampCount(table, issueId, 1);
					await stamps.expectSingleStamp(
						runPage.resultCellOf(table, resultId),
						issueId
					);
					await stamps.expectOrigin(
						stamps.stampsOf(table, issueId).first(),
						scenario.title,
						'import'
					);
				}
			);
			await and('I delete the issue', () =>
				deleteIssue(page, issueId, scenario.title)
			);
		}
	);

	test(
		'A match scope emptied to the path reaches every failure of the test in the next import',
		IMPORT_WRITE,
		async ({ page, request }) => {
			const stamps = new ResultStamps(page);
			const runPage = new RunPage(page);
			let scenario!: ImportCase;
			let issueId = 0;
			let table!: Locator;

			await given(
				'I classify a failing result of a seeded run under a new issue matching on the path alone for future runs',
				async () => {
					scenario = await importCase(
						request,
						'driver-unload-hang',
						'path only'
					);
					// The Result Type facet reads results as the stamps leave them,
					// so it tells unexpected from expected only on a test nothing
					// suppresses: the seed's rules over this pin must all count.
					requireCapability(
						scenario.seeded.rules
							.filter((rule) => rule.pin === scenario.pin.planId)
							.every((rule) => rule.effect !== 'suppressed'),
						`a seeded rule over pin "${scenario.pin.planId}" suppresses its results`
					);
					await claimRun(
						requireCapability(
							scenario.twin.runId,
							missingRunIdReason(scenario.twin)
						),
						`classify-import ${test.info().title}`
					);
					const drawer = await openClassifyOnPin(page, request, scenario);
					issueId = await classifyUnderNewIssue(
						drawer,
						scenario,
						scenario.title,
						(opened) => opened.clearAllMatch()
					);
				}
			);
			await when('the run imported after the rules is imported again', () =>
				reimportTwin(page, scenario)
			);
			await then(
				"every unexpected result of the test in that run carries the issue's stamp, laid on import",
				async () => {
					table = await openTwinTable(page, scenario);
					await runPage.toggleResultType(table, 'Unexpected');
					const unexpected = await runPage.resultRowCount(table);
					requireCapability(
						unexpected > 0,
						`run "${scenario.twin.id}" lists no unexpected result of "${scenario.pin.test}"`
					);
					await stamps.expectStampCount(table, issueId, unexpected);
					await stamps.expectOrigin(
						stamps.stampsOf(table, issueId).first(),
						scenario.title,
						'import'
					);
				}
			);
			await and('the results listed as expected carry none', async () => {
				await runPage.resetResultFilters(table);
				await runPage.toggleResultType(table, 'Expected');
				requireCapability(
					(await runPage.resultRowCount(table)) > 0,
					`run "${scenario.twin.id}" lists no expected result of "${scenario.pin.test}"`
				);
				await stamps.expectNotStamped(table, issueId);
			});
			await and('I delete the issue', () =>
				deleteIssue(page, issueId, scenario.title)
			);
		}
	);

	test(
		"Keeping this run's fixture tag keeps the rule from the next import",
		IMPORT_WRITE,
		async ({ page, request }) => {
			const stamps = new ResultStamps(page);
			let scenario!: ImportCase;
			let gated = 0;
			let shared = 0;
			let sharedTitle = '';

			await given(
				"I classify a failing result of a seeded run under an issue keeping the run's tags and its verdicts for future runs",
				async () => {
					scenario = await importCase(request, 'mtu-tcp-fragment', 'own tags');
					await claimRun(
						requireCapability(
							scenario.twin.runId,
							missingRunIdReason(scenario.twin)
						),
						`classify-import ${test.info().title}`
					);
					const fixtureId = requireCapability(
						scenario.source.tags['fixture_id'],
						`run "${scenario.source.id}" carries no fixture_id tag`
					);
					const drawer = await openClassifyOnPin(page, request, scenario);
					gated = await classifyUnderNewIssue(
						drawer,
						scenario,
						scenario.title,
						async () => {
							await drawer.clearMatch('parameters');
							// The run's important tags are kept to start with, its
							// own fixture_id among them.
							expect(await drawer.matchValues('tags')).toContain(
								`fixture_id=${String(fixtureId)}`
							);
							await drawer.expectMatch({ verdicts: true, tags: true });
						}
					);
				}
			);
			await and(
				'I classify it again under a second issue keeping only the tags the next run carries too',
				async () => {
					sharedTitle = cleanup.title('shared tags');
					const twinTags = new Set(
						Object.entries(scenario.twin.tags).map(
							([name, value]) => `${name}=${String(value)}`
						)
					);
					const drawer = await openClassifyOnPin(page, request, scenario);
					shared = await classifyUnderNewIssue(
						drawer,
						scenario,
						sharedTitle,
						async () => {
							await drawer.clearMatch('parameters');
							for (const value of await drawer.matchValues('tags')) {
								if (!twinTags.has(value)) {
									await drawer.removeMatchValue('tags', value);
								}
							}
							expect((await drawer.matchValues('tags')).length).toBeGreaterThan(
								0
							);
							await drawer.expectMatch({ verdicts: true, tags: true });
						}
					);
				}
			);
			await when('the run imported after the rules is imported again', () =>
				reimportTwin(page, scenario)
			);
			await then(
				'the second issue stamps the results with those verdicts and the first stamps none',
				async () => {
					const table = await openTwinTable(page, scenario);
					await stamps.expectStampCount(table, shared, twinRows(scenario));
					await stamps.expectOrigin(
						stamps.stampsOf(table, shared).first(),
						sharedTitle,
						'import'
					);
					await stamps.expectNotStamped(table, gated);
				}
			);
			await and(
				'the rules page shows both rules matching on the tags',
				async () => {
					await expectRuleChips(
						page,
						scenario,
						scenario.title,
						['Path', 'Verdicts', 'Tags'],
						true
					);
					await expectRuleChips(
						page,
						scenario,
						sharedTitle,
						['Path', 'Verdicts', 'Tags'],
						true
					);
				}
			);
			await and('I delete both issues', async () => {
				await deleteIssue(page, gated, scenario.title);
				await deleteIssue(page, shared, sharedTitle);
			});
		}
	);

	test(
		'Just this result leaves the next import alone',
		IMPORT_WRITE,
		async ({ page, request }) => {
			const stamps = new ResultStamps(page);
			const runPage = new RunPage(page);
			let scenario!: ImportCase;
			let oneOff = 0;
			let future = 0;
			let futureTitle = '';

			await given(
				'I classify a failing result of a seeded run under an issue for this result only, matching on the path alone',
				async () => {
					scenario = await importCase(request, 'driver-unload-hang', 'one-off');
					requireCapability(
						scenario.seeded.rules
							.filter((rule) => rule.pin === scenario.pin.planId)
							.every((rule) => rule.effect !== 'suppressed'),
						`a seeded rule over pin "${scenario.pin.planId}" suppresses its results`
					);
					await claimRun(
						requireCapability(
							scenario.twin.runId,
							missingRunIdReason(scenario.twin)
						),
						`classify-import ${test.info().title}`
					);
					const drawer = await openClassifyOnPin(page, request, scenario);
					oneOff = await classifyUnderNewIssue(
						drawer,
						scenario,
						scenario.title,
						async () => {
							await drawer.clearAllMatch();
							await drawer.setScope('Just this result');
						}
					);
				}
			);
			await and(
				'I classify it again under a second issue for future runs, matching on the path alone',
				async () => {
					futureTitle = cleanup.title('future');
					const drawer = await openClassifyOnPin(page, request, scenario);
					future = await classifyUnderNewIssue(
						drawer,
						scenario,
						futureTitle,
						(opened) => opened.clearAllMatch()
					);
				}
			);
			await when('the run imported after the rules is imported again', () =>
				reimportTwin(page, scenario)
			);
			await then(
				'the second issue stamps every unexpected result of the test and the first stamps none',
				async () => {
					const table = await openTwinTable(page, scenario);
					await runPage.toggleResultType(table, 'Unexpected');
					const unexpected = await runPage.resultRowCount(table);
					requireCapability(
						unexpected > 0,
						`run "${scenario.twin.id}" lists no unexpected result of "${scenario.pin.test}"`
					);
					await stamps.expectStampCount(table, future, unexpected);
					await stamps.expectNotStamped(table, oneOff);
				}
			);
			await and(
				"the rules page lists the first issue's rule inactive and the second's active",
				async () => {
					await expectRuleChips(
						page,
						scenario,
						scenario.title,
						['Path'],
						false
					);
					await expectRuleChips(page, scenario, futureTitle, ['Path'], true);
				}
			);
			await and('I delete both issues', async () => {
				await deleteIssue(page, oneOff, scenario.title);
				await deleteIssue(page, future, futureTitle);
			});
		}
	);
});
