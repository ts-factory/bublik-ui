/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';

import { LogPage } from './pages/log-page';
import { requireManifest } from './support/manifest';
import { requireCapability } from './support/capabilities';
import {
	firstErrorResultNode,
	firstMeasurementResultNode,
	firstResultNode,
	importedRunId,
	longLogNode,
	paginatedLogNode,
	representativeImportedRun
} from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { representativeNokRun } from './support/sample-cases';

test.describe('Log Page', () => {
	test(
		'The log layout follows the selected mode',
		{ tag: ['@smoke'] },
		async ({ page }) => {
			const runCase = representativeImportedRun(requireManifest());
			const logPage = new LogPage(page);

			await given('the fixture manifest describes an imported run', () =>
				expect(runCase.runId).toBeGreaterThan(0)
			);
			await when('I open its log in the tree-and-info mode', async () => {
				await logPage.goto(runCase.runId, 'mode=treeAndinfoAndlog');
				await logPage.expectLoaded();
			});
			await then('both the tree and the info panel are shown', async () => {
				await logPage.expectTreeVisible();
				await logPage.expectInfoVisible();
			});
			await when('I open its log in the log-only mode', async () => {
				await logPage.goto(runCase.runId, 'mode=log');
				await logPage.expectLoaded();
			});
			await then('neither the tree nor the info panel is shown', async () => {
				await logPage.expectTreeHidden();
				await logPage.expectInfoHidden();
			});
		}
	);

	test("Focusing a tree item loads that result's log", async ({
		page,
		request
	}) => {
		const runCase = representativeImportedRun(requireManifest());
		const logPage = new LogPage(page);
		const result = requireCapability(
			await firstResultNode(request, runCase),
			'Fixture tree contains no test result node.'
		);

		await given("the run's tree contains a test result", () =>
			expect(result.node.id).toBeTruthy()
		);
		await when('I open the log focused on that result', async () => {
			await logPage.goto(
				runCase.runId,
				`mode=treeAndlog&focusId=${result.node.id}`
			);
			await logPage.expectLoaded();
			await logPage.expectTreeVisible();
		});
		await then('the tree marks that result as focused', () =>
			logPage.expectFocusedTreeItem(result.node.id)
		);
		await and('the JSON log is rendered', () => logPage.expectJsonLogVisible());
		await when('I go back to the run log', () => logPage.showRunLog());
		await then('the JSON log is rendered', () =>
			logPage.expectJsonLogVisible()
		);
	});

	test(
		'The NOK-only tree keeps the focused error result reachable',
		{ tag: ['@needs-nok'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const representative = requireCapability(
				representativeNokRun(requireManifest()),
				'Fixture manifest contains no NOK samples.'
			);
			const runCase = {
				bundle: representative.bundle,
				expectedRun: representative.expectedRun,
				runId: importedRunId(representative.bundle)
			};
			const result = requireCapability(
				await firstErrorResultNode(request, runCase),
				'Fixture tree contains no error result node.'
			);

			await given(
				'a run with unexpected results has an error result in its tree',
				() => expect(result.node.id).toBeTruthy()
			);
			await when('I open the log focused on that error result', async () => {
				await logPage.goto(
					runCase.runId,
					`mode=treeAndlog&focusId=${result.node.id}`
				);
				await logPage.expectLoaded();
			});
			await and('I turn on the NOK-only tree', () => logPage.toggleOnlyNok());
			await and('I scroll to the focused result', () =>
				logPage.scrollToFocus()
			);
			await then('the tree marks that result as focused', () =>
				logPage.expectFocusedTreeItem(result.node.id)
			);
		}
	);

	test('The legacy toggle switches the log renderer', async ({ page }) => {
		const runCase = representativeImportedRun(requireManifest());
		const logPage = new LogPage(page);

		await given('I open the log of an imported run', () =>
			logPage.goto(runCase.runId)
		);
		await then('the JSON log is rendered', () =>
			logPage.expectJsonLogVisible()
		);
		await when('I turn on the legacy log', async () => {
			await logPage.toggleLegacyLog();
			await expect(page).toHaveURL(/legacy=true/, { timeout: 15_000 });
		});
		await then('the legacy log frame is shown', () =>
			logPage.expectLegacyLogVisible()
		);
		await when('I turn off the legacy log', async () => {
			await logPage.toggleLegacyLog();
			await expect(page).toHaveURL(/legacy=false/, { timeout: 15_000 });
		});
		await then('the JSON log is rendered', () =>
			logPage.expectJsonLogVisible()
		);
	});

	test('Bookmarking a log line survives a reload', async ({
		page,
		request
	}) => {
		const runCase = representativeImportedRun(requireManifest());
		const logPage = new LogPage(page);
		const result = requireCapability(
			await firstResultNode(request, runCase),
			'Fixture tree contains no test result node.'
		);
		let line = '1';

		await given('I open the log focused on a test result', async () => {
			await logPage.goto(runCase.runId, `focusId=${result.node.id}`);
			await logPage.expectJsonLogVisible();
		});
		await when('I click a log line number', async () => {
			line = await logPage.bookmarkFirstLine();
		});
		await and('I reload the page', async () => {
			await page.reload();
			await logPage.expectJsonLogVisible();
		});
		await then('the bookmarked line is still recorded in the URL', () =>
			expect(page).toHaveURL(new RegExp(`lineNumber=.*_${line}`), {
				timeout: 15_000
			})
		);
	});

	test(
		'A result with measurements links to its measurements page',
		{ tag: ['@needs-measurements'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const result = requireCapability(
				await firstMeasurementResultNode(request, requireManifest()),
				'Fixture manifest contains no result with measurements.'
			);

			await given(
				'the fixture manifest describes a result with measurements',
				() => expect(result.node.id).toBeTruthy()
			);
			await when('I open the log focused on that result', async () => {
				await logPage.goto(
					result.runCase.runId,
					`mode=treeAndinfoAndlog&focusId=${result.node.id}`
				);
				await logPage.expectLoaded();
			});
			await and('I follow the Result link', () =>
				logPage.openFocusedResultMeasurements()
			);
			await then('the measurements page is open', () =>
				expect(page).toHaveURL(/\/measurements(?:$|\?)/, { timeout: 15_000 })
			);
		}
	);

	test(
		'A log link restores the focused result and the layout',
		{ tag: ['@log', '@url-params'] },
		async ({ page, request }) => {
			const runCase = representativeImportedRun(requireManifest());
			const logPage = new LogPage(page);
			const result = requireCapability(
				await firstResultNode(request, runCase),
				'Fixture tree contains no test result node.'
			);
			const link = {
				mode: 'treeAndlog',
				focusId: String(result.node.id)
			};

			await given(
				'a link that focuses one result of a run in the tree-and-log layout',
				() => expect(result.node.id).toBeTruthy()
			);
			await when('I open that link', async () => {
				await logPage.gotoWithParams(runCase.runId, link);
				await logPage.expectLoaded();
			});
			await then('the tree marks that result as focused', () =>
				logPage.expectFocusedTreeItem(result.node.id)
			);
			await and('the tree is shown and the info panel is not', () =>
				logPage.expectModeLayout('treeAndlog')
			);
			await and(
				'the link still carries the focused result and the layout',
				() => logPage.expectParams(link)
			);
		}
	);

	test(
		'Focusing a result clears the bookmarked line and the page',
		{ tag: ['@log', '@url-params'] },
		async ({ page, request }) => {
			const runCase = representativeImportedRun(requireManifest());
			const logPage = new LogPage(page);
			const result = requireCapability(
				await firstResultNode(request, runCase),
				'Fixture tree contains no test result node.'
			);

			await given(
				'I open a log carrying a bookmarked line and a page',
				async () => {
					await logPage.gotoWithParams(runCase.runId, {
						mode: 'treeAndlog',
						page: '2',
						lineNumber: '0_5'
					});
					await logPage.expectLoaded();
					await logPage.expectParams({ page: '2', lineNumber: '0_5' });
				}
			);
			await when('I focus a result in the tree', () =>
				logPage.focusTreeItem(result.node.id)
			);
			await then('the focused result is recorded in the URL', () =>
				logPage.expectParams({ focusId: String(result.node.id) })
			);
			await and(
				'the bookmarked line and the page are dropped from the URL',
				() => logPage.expectParams({ lineNumber: null, page: null })
			);
		}
	);

	test(
		'Going back to the run log drops the focus, the line and the page',
		{ tag: ['@log', '@url-params'] },
		async ({ page, request }) => {
			const runCase = representativeImportedRun(requireManifest());
			const logPage = new LogPage(page);
			const result = requireCapability(
				await firstResultNode(request, runCase),
				'Fixture tree contains no test result node.'
			);

			await given(
				'I open a log focused on a result with a bookmarked line',
				async () => {
					await logPage.gotoWithParams(runCase.runId, {
						mode: 'treeAndlog',
						focusId: String(result.node.id),
						lineNumber: `${result.node.id}_1`,
						page: '2'
					});
					await logPage.expectLoaded();
					await logPage.expectTreeVisible();
				}
			);
			await when('I go back to the run log', () => logPage.showRunLog());
			await then(
				'the focused result, the bookmarked line and the page are all dropped from the URL',
				() =>
					logPage.expectParams({
						focusId: null,
						lineNumber: null,
						page: null
					})
			);
			await and('the JSON log is rendered', () =>
				logPage.expectJsonLogVisible()
			);
		}
	);

	test(
		'An unknown log layout in the link renders the log on its own',
		{ tag: ['@log', '@url-params'] },
		async ({ page }) => {
			const runCase = representativeImportedRun(requireManifest());
			const logPage = new LogPage(page);
			const unknownMode = 'treeAndeverything';

			await given('a link whose layout is not a layout the log renders', () =>
				expect(unknownMode).not.toBe('treeAndinfoAndlog')
			);
			await when('I open that link', async () => {
				await logPage.gotoWithParams(runCase.runId, { mode: unknownMode });
				await logPage.expectLoaded();
			});
			await then('neither the tree nor the info panel is shown', () =>
				logPage.expectModeLayout('log')
			);
			await and('the URL still carries the unknown layout', async () => {
				await logPage.expectParams({ mode: unknownMode });
				await logPage.expectRawMode(unknownMode);
			});
		}
	);

	test(
		'Turning on the legacy log records it in the URL and survives a reload',
		{ tag: ['@log', '@url-params'] },
		async ({ page }) => {
			const runCase = representativeImportedRun(requireManifest());
			const logPage = new LogPage(page);

			await given('I open the log of an imported run', async () => {
				await logPage.goto(runCase.runId);
				await logPage.expectJsonLogVisible();
			});
			await when('I turn on the legacy log', () => logPage.toggleLegacyLog());
			await then('the URL records the legacy renderer', () =>
				logPage.expectParams({ legacy: 'true' })
			);
			await when('I reload the page', () => page.reload());
			await then('the legacy log frame is shown', () =>
				logPage.expectLegacyLogVisible()
			);
			await when('I turn off the legacy log', () => logPage.toggleLegacyLog());
			await then('the URL records the legacy renderer as off', () =>
				logPage.expectParams({ legacy: 'false' })
			);
		}
	);

	test(
		'A link using the deprecated experimental parameter still opens the legacy log',
		{ tag: ['@log', '@url-params'] },
		async ({ page }) => {
			const runCase = representativeImportedRun(requireManifest());
			const logPage = new LogPage(page);

			const link = { experimental: 'false' };

			await given(
				'a link that asks for the legacy log through the deprecated parameter',
				() => expect(link.experimental).toBe('false')
			);
			await when('I open that link', async () => {
				await logPage.gotoWithParams(runCase.runId, link);
				await logPage.expectLoaded();
			});
			await then('the legacy log frame is shown', () =>
				logPage.expectLegacyLogVisible()
			);
			await when('I turn off the legacy log', () => logPage.toggleLegacyLog());
			await then('the deprecated parameter is dropped from the URL', () =>
				logPage.expectParams({ experimental: null })
			);
			await and('the URL records the legacy renderer as off', () =>
				logPage.expectParams({ legacy: 'false' })
			);
		}
	);

	test(
		'The NOK-only tree toggle is not recorded in the URL',
		{ tag: ['@log', '@url-params', '@needs-nok'] },
		async ({ page }) => {
			const logPage = new LogPage(page);
			const representative = requireCapability(
				representativeNokRun(requireManifest()),
				'Fixture manifest contains no NOK samples.'
			);
			const runId = importedRunId(representative.bundle);
			let before = 0;

			await given(
				'I open the log of a run with unexpected results',
				async () => {
					await logPage.gotoWithParams(runId, { mode: 'treeAndlog' });
					await logPage.expectLoaded();
					await logPage.expectTreeVisible();
					await expect
						.poll(() => logPage.treeItems().count(), { timeout: 30_000 })
						.toBeGreaterThan(0);
					before = await logPage.treeItems().count();
				}
			);
			await when('I turn on the NOK-only tree', () => logPage.toggleOnlyNok());
			await then('the tree lists fewer results', () =>
				expect
					.poll(() => logPage.treeItems().count(), {
						timeout: 30_000,
						message: 'tree items after filtering to NOK only'
					})
					.toBeLessThan(before)
			);
			await and('the log parameters are unchanged', () =>
				logPage.expectParams({
					focusId: null,
					lineNumber: null,
					page: null,
					mode: 'treeAndlog'
				})
			);
		}
	);

	test(
		'A log with several pages opens on its first page',
		{ tag: ['@log', '@url-params', '@needs-log-pagination'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const logCase = requireCapability(
				await paginatedLogNode(request, requireManifest()),
				'Fixture manifest contains no log spanning several pages.'
			);

			await given('a fixture result whose log spans several pages', () =>
				expect(logCase.entry.pagesCount).toBeGreaterThan(1)
			);
			await when("I open that result's log", async () => {
				await logPage.forgetAllPagesMemory();
				await logPage.goto(logCase.runCase.runId, `focusId=${logCase.node.id}`);
				await logPage.expectJsonLogVisible();
			});
			await then('the pager offers every page of the log', () =>
				logPage.expectPagesCount(logCase.entry.pagesCount)
			);
			await and('the first page is the one shown', () =>
				logPage.expectCurrentPage(1)
			);
			await and('the URL carries no page', () =>
				logPage.expectParams({ page: null })
			);
		}
	);

	test(
		'A link to a later page of a log opens that page',
		{ tag: ['@log', '@url-params', '@needs-log-pagination'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const logCase = requireCapability(
				await paginatedLogNode(request, requireManifest()),
				'Fixture manifest contains no log spanning several pages.'
			);
			let firstPageTopRow = '';

			await given(
				'a fixture result whose log spans several pages',
				async () => {
					await logPage.forgetAllPagesMemory();
					await logPage.goto(
						logCase.runCase.runId,
						`focusId=${logCase.node.id}`
					);
					await logPage.expectJsonLogVisible();
					firstPageTopRow = await logPage.firstRowId();
				}
			);
			await when('I open a link to its second page', async () => {
				await logPage.gotoWithParams(logCase.runCase.runId, {
					focusId: String(logCase.node.id),
					page: '2'
				});
				await logPage.expectJsonLogVisible();
			});
			await then('the second page is the one shown', () =>
				logPage.expectCurrentPage(2)
			);
			await and('the URL still carries the second page', () =>
				logPage.expectParams({ page: '2' })
			);
			await and('the rows shown are not the rows of the first page', async () =>
				expect(await logPage.firstRowId()).not.toBe(firstPageTopRow)
			);
		}
	);

	test(
		'Paging back to the first page drops the page and the bookmarked line',
		{ tag: ['@log', '@url-params', '@needs-log-pagination'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const logCase = requireCapability(
				await paginatedLogNode(request, requireManifest()),
				'Fixture manifest contains no log spanning several pages.'
			);

			await given("I open the second page of a result's log", async () => {
				await logPage.forgetAllPagesMemory();
				await logPage.gotoWithParams(logCase.runCase.runId, {
					focusId: String(logCase.node.id),
					page: '2'
				});
				await logPage.expectCurrentPage(2);
			});
			await when('I bookmark a log line', () => logPage.bookmarkFirstLine());
			await and('I page back to the first page', () => logPage.openPage(1));
			await then('the page is dropped from the URL', () =>
				logPage.expectParams({ page: null })
			);
			await and('the bookmarked line is dropped from the URL', () =>
				logPage.expectParams({ lineNumber: null })
			);
			await and('the first page is the one shown', () =>
				logPage.expectCurrentPage(1)
			);
		}
	);

	test(
		'Asking for all pages records page zero and shows the whole log',
		{ tag: ['@log', '@url-params', '@needs-log-pagination'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const logCase = requireCapability(
				await paginatedLogNode(request, requireManifest()),
				'Fixture manifest contains no log spanning several pages.'
			);

			await given(
				"I open a result's log that spans several pages",
				async () => {
					await logPage.forgetAllPagesMemory();
					await logPage.goto(
						logCase.runCase.runId,
						`focusId=${logCase.node.id}`
					);
					await logPage.expectCurrentPage(1);
				}
			);
			await when('I ask for all pages', () => logPage.openAllPages());
			await then('the URL records page zero', () =>
				logPage.expectParams({ page: '0' })
			);
			await and('the All pages button is pressed', () =>
				logPage.expectAllPagesActive(true)
			);
			await and('the log shows every row of every page', async () =>
				expect(await logPage.logRowCount()).toBe(logCase.entry.rowCount)
			);
		}
	);

	test(
		'A link that asks for every page keeps the pager but marks no page current',
		{ tag: ['@log', '@needs-log-pagination'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const logCase = requireCapability(
				await paginatedLogNode(request, requireManifest()),
				'Fixture manifest contains no log spanning several pages.'
			);

			await given('a fixture result whose log spans several pages', () =>
				expect(logCase.entry.pagesCount).toBeGreaterThan(1)
			);
			await when('I open a link that asks for all pages', async () => {
				await logPage.forgetAllPagesMemory();
				await logPage.gotoWithParams(logCase.runCase.runId, {
					focusId: String(logCase.node.id),
					page: '0'
				});
				await logPage.expectJsonLogVisible();
			});
			await then('the All pages button is pressed', () =>
				logPage.expectAllPagesActive(true)
			);
			await and('the pager still offers every page of the log', () =>
				logPage.expectPagesCount(logCase.entry.pagesCount)
			);
			await and('no page is marked as the current one', () =>
				logPage.expectNoCurrentPage()
			);
			await when('I go back to the first page', () => logPage.openPage(1));
			await then('the first page is the one shown', () =>
				logPage.expectCurrentPage(1)
			);
		}
	);

	test(
		'A bookmarked line deep in a long log is scrolled back into view',
		{ tag: ['@log', '@url-params', '@needs-long-log'] },
		async ({ page, request }) => {
			const logPage = new LogPage(page);
			const logCase = requireCapability(
				await longLogNode(request, requireManifest()),
				'Fixture manifest contains no long single-page log.'
			);
			let topRow = '';
			let bookmark = '';

			test.slow();

			await given('I open a result with a long single-page log', async () => {
				await logPage.forgetAllPagesMemory();
				await logPage.goto(logCase.runCase.runId, `focusId=${logCase.node.id}`);
				await logPage.expectJsonLogVisible();
				await logPage.expectNoPager();
				topRow = await logPage.firstRowId();
			});
			await when('I bookmark a line near the end of the log', async () => {
				bookmark = await logPage.bookmarkLine(logCase.entry.rowCount - 5);
			});
			await and('I reload the page', async () => {
				await page.reload();
				await logPage.expectJsonLogVisible();
			});
			await then('the bookmarked line is still recorded in the URL', () =>
				logPage.expectParams({ lineNumber: bookmark })
			);
			await and('that line is back in view', () =>
				logPage.expectRowInViewport(bookmark)
			);
			await and('the top of the log is out of view', () =>
				logPage.expectRowOutOfViewport(topRow)
			);
		}
	);
});
