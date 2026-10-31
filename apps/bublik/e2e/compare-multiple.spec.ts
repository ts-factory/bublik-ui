/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import type { Page } from '@playwright/test';

import { expect, test } from './support/test';

import type { ClassifyDrawer } from './pages/classify-drawer';
import { IssuesPage } from './pages/issues-page';
import { LogPage } from './pages/log-page';
import { ResultStamps } from './pages/result-stamps';
import { RunDiffPage } from './pages/run-diff-page';
import { RunMultiplePage } from './pages/run-multiple-page';
import { RunPage } from './pages/run-page';
import { requireManifest } from './support/manifest';
import { requireCapability } from './support/capabilities';
import { IssueCleanup } from './support/classification';
import { importedRunId, projectIdByName } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import {
	claimFailingResult,
	claimFailingResultsInRuns,
	representativeNokRun,
	runPairOnSameDate
} from './support/sample-cases';
import type { ClassifiableResult } from './support/sample-cases';

function comparableRunIds(): [number, number] {
	const pair = requireCapability(
		runPairOnSameDate(requireManifest()),
		'Fixture manifest contains no two runs sharing a project and a date.'
	);

	return [importedRunId(pair.bundles[0]), importedRunId(pair.bundles[1])];
}

test.describe('Compare Page', () => {
	test('Comparing without a run selection explains what is missing', async ({
		page
	}) => {
		const comparePage = new RunDiffPage(page);

		await when('I open the compare page without run parameters', () =>
			comparePage.goto()
		);
		await then('it reports that no runs are selected', () =>
			comparePage.expectMissingRunsError()
		);
	});

	test("Comparing two runs shows the diff and links to a run's log", async ({
		page
	}) => {
		const comparePage = new RunDiffPage(page);
		const logPage = new LogPage(page);
		const [leftRunId, rightRunId] = comparableRunIds();

		await given('the fixture manifest describes two imported runs', () =>
			expect(leftRunId).not.toBe(rightRunId)
		);
		await when('I open the compare page for both runs', () =>
			comparePage.goto(leftRunId, rightRunId)
		);
		await then('the diff is rendered', () => comparePage.expectLoaded());
		await when('I switch to the info diff', () => comparePage.showInfoDiff());
		await and("I follow the left run's Log link", () =>
			comparePage.openLeftLog()
		);
		await then('the log page is open', () => logPage.expectLoaded());
	});

	test(
		'Toggling a row in the comparison is recorded in the URL and survives a reload',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const comparePage = new RunDiffPage(page);
			const [leftRunId, rightRunId] = comparableRunIds();
			let before = 0;
			let after = 0;

			test.slow();
			await given('I open the compare page for two runs', async () => {
				await comparePage.goto(leftRunId, rightRunId);
				await comparePage.expectLoaded();
				await comparePage.expectRowsRendered();
				before = await comparePage.rowCount();
				expect(before).toBeGreaterThan(0);
			});
			await when('I toggle the first row of the diff', () =>
				comparePage.toggleFirstRow()
			);
			await then('the diff records the expanded rows in the URL', () =>
				comparePage.expectParamsPresent(['expanded'])
			);
			await and('the rows it renders have changed', async () => {
				await expect
					.poll(() => comparePage.rowCount(), {
						timeout: 30_000,
						message: 'rows after toggling the first one'
					})
					.not.toBe(before);
				after = await comparePage.rowCount();
			});
			await when('I reload the page', async () => {
				await page.reload();
				await comparePage.expectLoaded();
			});
			await then('the diff renders the same rows again', () =>
				comparePage.expectRowCount(after)
			);
		}
	);

	test(
		'A compare link restores both sides it names',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const comparePage = new RunDiffPage(page);
			const [leftRunId, rightRunId] = comparableRunIds();
			const link = { left: String(leftRunId), right: String(rightRunId) };

			await given('a link that pins two runs to compare', () =>
				expect(leftRunId).not.toBe(rightRunId)
			);
			await when('I open that link', () => comparePage.gotoWithParams(link));
			await then('the diff is rendered', () => comparePage.expectLoaded());
			await and('the link still carries both sides', () =>
				comparePage.expectParams(link)
			);
		}
	);
});

test.describe('Multiple Runs Page', () => {
	test('Opening the multiple view without runs explains what is missing', async ({
		page
	}) => {
		const multiplePage = new RunMultiplePage(page);

		await when('I open the multiple page without run parameters', () =>
			multiplePage.goto([])
		);
		await then('it reports that the run ids are missing', () =>
			multiplePage.expectMissingRunsEmptyState()
		);
	});

	test('The multiple view switches which run is selected', async ({ page }) => {
		const multiplePage = new RunMultiplePage(page);
		const logPage = new LogPage(page);
		const [firstRunId, secondRunId] = comparableRunIds();

		await given('the fixture manifest describes two imported runs', () =>
			expect(firstRunId).not.toBe(secondRunId)
		);
		await when('I open the multiple page for both runs', async () => {
			await multiplePage.goto([firstRunId, secondRunId]);
			await multiplePage.expectLoaded();
		});
		await and('I select the second run', () =>
			multiplePage.selectRun(secondRunId)
		);
		await then('the selection is recorded in the URL', () =>
			expect(page).toHaveURL(new RegExp(`selected=${secondRunId}`))
		);
		await when("I follow the selected run's Log link", () =>
			multiplePage.openSelectedLog()
		);
		await then('the log page is open', () => logPage.expectLoaded());
	});

	test(
		'Preview NOK applies across the merged runs',
		{ tag: ['@needs-nok'] },
		async ({ page }) => {
			const multiplePage = new RunMultiplePage(page);
			const runPage = new RunPage(page);
			const representative = requireCapability(
				representativeNokRun(requireManifest()),
				'Fixture manifest contains no NOK samples.'
			);
			const nokRunId = importedRunId(representative.bundle);
			const otherRunId = comparableRunIds().find((id) => id !== nokRunId);

			await given(
				'I open the multiple page for a run with unexpected results',
				async () => {
					await multiplePage.goto(
						otherRunId ? [nokRunId, otherRunId] : [nokRunId]
					);
					await multiplePage.expectLoaded();
				}
			);
			await when('I press Preview NOK', () => runPage.previewNok());
			await then('the tests with unexpected results are listed', async () => {
				for (const sampleName of representative.sampleNames) {
					await expect(page.getByText(sampleName).first()).toBeVisible({
						timeout: 15_000
					});
				}
			});
		}
	);

	test(
		'A multiple-runs link restores every run it pins and the one it selected',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const multiplePage = new RunMultiplePage(page);
			const [firstRunId, secondRunId] = comparableRunIds();

			await given('a link that pins two runs and selects the second', () =>
				expect(firstRunId).not.toBe(secondRunId)
			);
			await when('I open that link', async () => {
				await multiplePage.gotoWithParams({
					runIds: [String(firstRunId), String(secondRunId)],
					selected: String(secondRunId)
				});
				await multiplePage.expectLoaded();
			});
			await then('the merged tree of both runs is shown', () =>
				multiplePage.expectLoaded()
			);
			await and(
				'the link still repeats both run ids and names the selection',
				async () => {
					await multiplePage.expectRunIdsPinned([firstRunId, secondRunId]);
					await multiplePage.expectParams({ selected: String(secondRunId) });
				}
			);
		}
	);

	test(
		'The multiple view falls back to the first run when the link names no selection',
		{ tag: ['@runs', '@url-params'] },
		async ({ page }) => {
			const multiplePage = new RunMultiplePage(page);
			const [firstRunId, secondRunId] = comparableRunIds();

			await given('a link that pins two runs without naming a selection', () =>
				expect(firstRunId).not.toBe(secondRunId)
			);
			await when('I open that link', async () => {
				await multiplePage.gotoWithParams({
					runIds: [String(firstRunId), String(secondRunId)]
				});
				await multiplePage.expectLoaded();
			});
			await then('the merged tree of both runs is shown', () =>
				multiplePage.expectLoaded()
			);
			await and('no selection is written to the URL', () =>
				multiplePage.expectParams({ selected: null })
			);
			await when('I select the second run', () =>
				multiplePage.selectRun(secondRunId)
			);
			await then('the selection is recorded in the URL', () =>
				multiplePage.expectParams({ selected: String(secondRunId) })
			);
			await and('both run ids are still pinned', () =>
				multiplePage.expectRunIdsPinned([firstRunId, secondRunId])
			);
		}
	);
});

const CLASSIFY_WRITE = { tag: ['@issues', '@issues-write', '@needs-nok'] };

const cleanup = new IssueCleanup('run-multiple');

/** A run of the same project as `runId`, to merge with it: read, never written. */
function otherRunOfProject(result: ClassifiableResult): number {
	const other = requireCapability(
		requireManifest().bundles.find(
			(bundle) =>
				bundle.runId &&
				bundle.runId !== result.runId &&
				bundle.project === result.run.bundle.project
		),
		`Project "${result.run.bundle.project}" has no second imported run.`
	);

	return Number(other.runId);
}

/** Opens each result's test in the merged tree and picks the result. */
async function pickResults(
	page: Page,
	results: readonly ClassifiableResult[]
): Promise<void> {
	const runPage = new RunPage(page);
	const stamps = new ResultStamps(page);
	// Every table first: the selection popover the first pick opens sits
	// over the tree's lower rows.
	const tables = [];

	for (const result of results) {
		tables.push(await stamps.openTestResults(result.path));
	}
	for (const [index, result] of results.entries()) {
		await runPage.selectResultCell(
			runPage.resultCellOf(tables[index], result.resultId)
		);
	}
}

/** Opens the results' tests again and expects each result stamped once by the issue. */
async function expectStamped(
	page: Page,
	runIds: readonly number[],
	results: readonly ClassifiableResult[],
	issueId: number
): Promise<void> {
	const multiplePage = new RunMultiplePage(page);
	const runPage = new RunPage(page);
	const stamps = new ResultStamps(page);

	await multiplePage.goto([...runIds]);
	await multiplePage.expectLoaded();
	for (const result of results) {
		const table = await stamps.openTestResults(result.path);
		await stamps.expectSingleStamp(
			runPage.resultCellOf(table, result.resultId),
			issueId
		);
	}
}

async function deleteIssue(
	page: Page,
	projectId: number,
	title: string,
	issueId: number
): Promise<void> {
	const issuesPage = new IssuesPage(page);

	await issuesPage.goto({ project: String(projectId) });
	await issuesPage.expectLoaded();
	await issuesPage.table.search(title);
	await issuesPage.expectIssueListed(title);
	await issuesPage.deleteIssue(title);
	cleanup.forget(issueId);
}

test.describe('Multiple Runs Page: classifying', () => {
	test.afterEach(async ({ request }, testInfo) => {
		if (!testInfo.tags.includes('@issues-write')) return;

		await cleanup.sweep(request);
	});

	test(
		'Results and runs selections stack in one dock',
		{ tag: ['@issues', '@needs-nok'] },
		async ({ page, request }) => {
			const multiplePage = new RunMultiplePage(page);
			let picked!: ClassifiableResult;

			await given(
				'the multiple page for two runs, with both runs selected',
				async () => {
					// Leased though nothing is written: no scenario classifying it
					// meanwhile changes the row picked.
					picked = await claimFailingResult(
						request,
						`run-multiple ${test.info().title}`
					);
					await multiplePage.gotoWithRunsSelected([
						picked.runId,
						otherRunOfProject(picked)
					]);
					await multiplePage.expectLoaded();
				}
			);
			await when('I pick a failing result of one of them', () =>
				pickResults(page, [picked])
			);
			await then(
				'the results selection is stacked above the runs selection in the dock',
				() => multiplePage.expectSelectionsStacked(2, 1)
			);
			await when('I open the runs selection', () =>
				multiplePage.openSelectionPanel('runs')
			);
			await then('only the runs selection is open', () =>
				multiplePage.expectOnlyPanelOpen('runs')
			);
			await when('I open the results selection', () =>
				multiplePage.openSelectionPanel('results')
			);
			await then('only the results selection is open', () =>
				multiplePage.expectOnlyPanelOpen('results')
			);
		}
	);

	test(
		'Results picked in one of the merged runs classify in bulk as on the run page',
		CLASSIFY_WRITE,
		async ({ page, request }) => {
			test.slow();
			const multiplePage = new RunMultiplePage(page);
			const runPage = new RunPage(page);
			const title = cleanup.title('one run');
			let picked!: ClassifiableResult;
			let runIds: number[] = [];
			let projectId = 0;
			let issueId = 0;

			await given(
				'I pick a failing result of one run on the multiple page of two runs',
				async () => {
					picked = await claimFailingResult(
						request,
						`run-multiple ${test.info().title}`
					);
					projectId = requireCapability(
						await projectIdByName(request, picked.run.bundle.project),
						`Project "${picked.run.bundle.project}" is not registered.`
					);
					runIds = [picked.runId, otherRunOfProject(picked)];
					await multiplePage.goto(runIds);
					await multiplePage.expectLoaded();
					await pickResults(page, [picked]);
				}
			);
			await when('I classify the selection under a new issue', async () => {
				const drawer = await runPage.classifySelection();
				await drawer.expectRunSpan(1, 1);
				await drawer.fillNewIssue({ title });
				issueId = await drawer.submitForIssueId();
				cleanup.register(issueId, projectId);
			});
			await then('the picked result carries a single stamp of the issue', () =>
				expectStamped(page, runIds, [picked], issueId)
			);
			await and('I delete the issue', () =>
				deleteIssue(page, projectId, title, issueId)
			);
		}
	);

	test(
		'Results picked across the merged runs classify under one issue',
		CLASSIFY_WRITE,
		async ({ page, request }) => {
			// Two runs' trees, a request per run, and the stamps read back: a
			// minute is short for that under load.
			test.slow();
			const multiplePage = new RunMultiplePage(page);
			const runPage = new RunPage(page);
			const title = cleanup.title('two runs');
			let picked: ClassifiableResult[] = [];
			let runIds: number[] = [];
			let projectId = 0;
			let issueId = 0;
			let drawer!: ClassifyDrawer;

			await given(
				'I pick a failing result of each of two runs on the multiple page for both runs',
				async () => {
					picked = requireCapability(
						await claimFailingResultsInRuns(
							request,
							`run-multiple ${test.info().title}`,
							2
						),
						'Fixture manifest has failing results in fewer than two classifiable runs.'
					);
					projectId = requireCapability(
						await projectIdByName(request, picked[0].run.bundle.project),
						`Project "${picked[0].run.bundle.project}" is not registered.`
					);
					runIds = picked.map((result) => result.runId);
					await multiplePage.goto(runIds);
					await multiplePage.expectLoaded();
					await pickResults(page, picked);
				}
			);
			await then('the selection says it spans both runs', () =>
				multiplePage.expectSelectionSpans(2, 2)
			);
			await when('I open Classify on the selection', async () => {
				drawer = await runPage.classifySelection();
			});
			await then(
				'the drawer says how many results and runs it classifies',
				() => drawer.expectRunSpan(2, 2)
			);
			await when('I classify them under a new issue', async () => {
				await drawer.fillNewIssue({ title });
				issueId = await drawer.submitForIssueId();
				cleanup.register(issueId, projectId);
			});
			await then('each picked result carries a single stamp of the issue', () =>
				expectStamped(page, runIds, picked, issueId)
			);
			await and('I delete the issue', () =>
				deleteIssue(page, projectId, title, issueId)
			);
		}
	);
});
