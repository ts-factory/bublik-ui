/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';
import type { Page } from '@playwright/test';

import { RunReportPage } from './pages/run-report-page';
import { requireManifest } from './support/manifest';
import { requireCapability } from './support/capabilities';
import {
	firstReportConfig,
	reportConfiguredImportedRun,
	reportFixture
} from './support/e2e-data';
import type { ReportFixture } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';

const UNKNOWN_CONFIG_ID = 999_999;

async function openRenderedReport(
	page: Page
): Promise<{ reportPage: RunReportPage; fixture: ReportFixture }> {
	const reportPage = new RunReportPage(page);
	const fixture = await reportFixture(page, requireManifest());

	await reportPage.goto(fixture.runId, fixture.configId);
	await reportPage.expectLoaded();

	return { reportPage, fixture };
}

test.describe('Run Report Page', () => {
	// eslint-disable-next-line playwright/expect-expect
	test(
		'A report without a configuration reports the missing config',
		{ tag: ['@report'] },
		async ({ page }) => {
			const reportPage = new RunReportPage(page);
			const runCase = reportConfiguredImportedRun(requireManifest());

			await given(
				'the fixture manifest describes a run whose project has a report config',
				() => expect(runCase.runId).toBeGreaterThan(0)
			);
			await when(
				"I open that run's report without choosing a configuration",
				() => reportPage.goto(runCase.runId)
			);
			await then('the page reports that the config id is missing', () =>
				reportPage.expectMissingConfig()
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A report renders for the configured report config',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const reportPage = new RunReportPage(page);
			const runCase = reportConfiguredImportedRun(requireManifest());
			const config = requireCapability(
				await firstReportConfig(page, runCase.runId),
				'Fixture setup did not create a report config for this run.'
			);

			await given('a report config exists for that run', () =>
				expect(config.id).toBeTruthy()
			);
			await when("I open the run's report for that config", () =>
				reportPage.goto(runCase.runId, config.id)
			);
			await then('the report page is rendered', () =>
				reportPage.expectLoaded()
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The report links back to the configuration that produced it',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const reportPage = new RunReportPage(page);
			const runCase = reportConfiguredImportedRun(requireManifest());
			const config = requireCapability(
				await firstReportConfig(page, runCase.runId),
				'Fixture setup did not create a report config for this run.'
			);

			await given('I open a rendered report', async () => {
				await reportPage.goto(runCase.runId, config.id);
				await reportPage.expectLoaded();
			});
			await when('I follow the Config link', () =>
				reportPage.openConfigEditor()
			);
			await then('the configuration editor opens for that config', () =>
				expect(page).toHaveURL(/\/admin\/config\?configId=/)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A report opened with an unknown config id reports the failure',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const reportPage = new RunReportPage(page);
			const runCase = reportConfiguredImportedRun(requireManifest());

			await given(
				'the fixture manifest describes a run whose project has a report config',
				() => expect(runCase.runId).toBeGreaterThan(0)
			);
			await when(
				"I open that run's report for a config id that does not exist",
				() => reportPage.goto(runCase.runId, UNKNOWN_CONFIG_ID)
			);
			await then('the page reports that the config was not found', () =>
				reportPage.expectConfigNotFound(UNKNOWN_CONFIG_ID)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The report renders every test block from the report payload',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const reportPage = new RunReportPage(page);
			const fixture = await reportFixture(page, requireManifest());

			await given('the report payload lists the test blocks it contains', () =>
				expect(fixture.testBlocks.length).toBeGreaterThan(0)
			);
			await when('I open the rendered report', async () => {
				await reportPage.goto(fixture.runId, fixture.configId);
				await reportPage.expectLoaded();
			});
			await then(
				'every test block from the payload is on the page',
				async () => {
					for (const block of fixture.testBlocks) {
						await reportPage.expectBlockVisible(block.id);
					}
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The table of contents lists every block in the report',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const reportPage = new RunReportPage(page);
			const fixture = await reportFixture(page, requireManifest());

			const measurement = requireCapability(
				fixture.measurementItems[0],
				'Report payload contains no measurement blocks.'
			);
			const recordIds = fixture.recordItems
				.filter((record) => record.id.startsWith(`${measurement.id}_`))
				.map((record) => record.id);

			await given('the report payload lists its blocks at every level', () => {
				expect(fixture.recordItems.length).toBeGreaterThan(0);
				expect(recordIds.length).toBeGreaterThan(0);
			});
			await when('I open the rendered report', async () => {
				await reportPage.goto(fixture.runId, fixture.configId);
				await reportPage.expectLoaded();
			});
			await then(
				'every test, argument values and measurement block has an entry',
				async () => {
					await reportPage.expectTableOfContentsVisible();
					await reportPage.expectTableOfContentsLists(
						[
							...fixture.testBlocks,
							...fixture.argValItems,
							...fixture.measurementItems
						].map((item) => item.id)
					);
				}
			);
			await when('I expand a measurement entry', () =>
				reportPage.toggleTocEntry(measurement.id)
			);
			await then('its records are listed too', () =>
				reportPage.expectTableOfContentsLists(recordIds)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a table of contents entry scrolls to its block and records the anchor in the URL',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const target = requireCapability(
				fixture.measurementItems.at(-1),
				'Report payload contains no measurement blocks.'
			);

			await given('I open a rendered report', () => reportPage.expectLoaded());
			await when('I follow a table of contents entry for a measurement', () =>
				reportPage.openTocEntry(target.id)
			);
			await then('the report scrolls to that block', async () => {
				await reportPage.expectScrolled();
				await reportPage.expectScrolledTo(target.id);
			});
			await and(
				'the URL anchors that block on the same configuration',
				async () => {
					await reportPage.expectHash(target.id);
					await reportPage.expectConfigParam(fixture.configId);
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Opening the report at an anchor scrolls straight to that block',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const reportPage = new RunReportPage(page);
			const fixture = await reportFixture(page, requireManifest());
			const target = requireCapability(
				fixture.recordItems.at(-1),
				'Report payload contains no record blocks.'
			);

			await given('the report payload lists a record far down the report', () =>
				expect(target.id).toBeTruthy()
			);
			await when("I open the report at that record's anchor", async () => {
				await reportPage.goto(fixture.runId, fixture.configId, {
					hash: target.id
				});
				await reportPage.expectLoaded();
			});
			await then('that record is rendered', () =>
				reportPage.expectBlockRendered(target.id)
			);
			await and('the report scrolls to that block', async () => {
				await reportPage.expectScrolled();
				await reportPage.expectScrolledTo(target.id);
			});
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Reloading an anchored report restores the same block',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const reportPage = new RunReportPage(page);
			const fixture = await reportFixture(page, requireManifest());
			const target = requireCapability(
				fixture.recordItems.at(-1),
				'Report payload contains no record blocks.'
			);

			await given("I open the report at a record's anchor", async () => {
				await reportPage.goto(fixture.runId, fixture.configId, {
					hash: target.id
				});
				await reportPage.expectLoaded();
				await reportPage.expectScrolledTo(target.id);
			});
			await when('I reload the page', async () => {
				await page.reload();
				await reportPage.expectLoaded();
			});
			await then('that record is rendered', () =>
				reportPage.expectBlockRendered(target.id)
			);
			await and('the report scrolls to that block', () =>
				reportPage.expectScrolledTo(target.id)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Browser back returns to the previously anchored block',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const first = requireCapability(
				fixture.measurementItems[0],
				'Report payload contains no measurement blocks.'
			);
			const second = requireCapability(
				fixture.measurementItems.at(-1),
				'Report payload contains no measurement blocks.'
			);

			await given(
				'I follow a table of contents entry for a measurement',
				async () => {
					await reportPage.openTocEntry(first.id);
					await reportPage.expectHash(first.id);
				}
			);
			await when(
				'I follow a table of contents entry for another measurement',
				async () => {
					await reportPage.openTocEntry(second.id);
					await reportPage.expectHash(second.id);
				}
			);
			await and('I go back', () => page.goBack());
			await then('the URL anchors the first block again', () =>
				reportPage.expectHash(first.id)
			);
			await and('the report scrolls to that block', () =>
				reportPage.expectScrolledTo(first.id)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Saving a location from a record header confirms the anchor',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const record = requireCapability(
				fixture.recordItems[0],
				'Report payload contains no record blocks.'
			);

			await given('I open a rendered report', () => reportPage.expectLoaded());
			await when("I follow a record's own header link", () =>
				reportPage.saveRecordLocation(record.id)
			);
			await then('the page confirms the location was saved', () =>
				reportPage.expectLocationSaved()
			);
			await and('the URL anchors that record', () =>
				reportPage.expectHash(record.id)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Collapsing a table of contents entry hides its children and survives a reload',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const testBlock = requireCapability(
				fixture.testBlocks[0],
				'Report payload contains no test blocks.'
			);
			const child = requireCapability(
				fixture.argValItems[0],
				'Report payload contains no argument values blocks.'
			);

			await given('I open a rendered report', () =>
				reportPage.expectTocEntryExpanded(testBlock.id)
			);
			await when('I collapse a test block in the table of contents', () =>
				reportPage.toggleTocEntry(testBlock.id)
			);
			await then(
				'its child entries are gone and the URL records the collapsed block',
				async () => {
					await reportPage.expectTocEntryCollapsed(testBlock.id);
					await reportPage.expectTocEntryAbsent(child.id);
					await reportPage.expectSearchParam(testBlock.id, '0');
				}
			);
			await when('I reload the page', async () => {
				await page.reload();
				await reportPage.expectLoaded();
			});
			await then('the block is still collapsed', async () => {
				await reportPage.expectTocEntryCollapsed(testBlock.id);
				await reportPage.expectTocEntryAbsent(child.id);
			});
			await when('I expand it again', () =>
				reportPage.toggleTocEntry(testBlock.id)
			);
			await then('its child entries are back', async () => {
				await reportPage.expectTocEntryExpanded(testBlock.id);
				await reportPage.expectTableOfContentsLists([child.id]);
			});
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Pressing j moves to the next argument values block',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const [first, second] = fixture.argValItems;

			requireCapability(
				second,
				'Report payload has fewer than two navigable argument values blocks.'
			);

			await given('I open a rendered report at its top', () =>
				reportPage.expectScrollerAtTop()
			);
			await when('I press j', () => reportPage.pressNextArgValBlock());
			await then(
				'the report scrolls to the first argument values block',
				async () => {
					await reportPage.expectHash(first.id);
					await reportPage.expectScrolledTo(first.id);
				}
			);
			await when('I press j again', () => reportPage.pressNextArgValBlock());
			await then(
				'the report scrolls to the second argument values block',
				async () => {
					await reportPage.expectHash(second.id);
					await reportPage.expectScrolledTo(second.id);
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Pressing k moves back to the previous argument values block',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const [first, second] = fixture.argValItems;

			requireCapability(
				second,
				'Report payload has fewer than two navigable argument values blocks.'
			);

			await given(
				'I have moved to the second argument values block',
				async () => {
					await reportPage.pressNextArgValBlock();
					await reportPage.expectScrolledTo(first.id);
					await reportPage.pressNextArgValBlock();
					await reportPage.expectScrolledTo(second.id);
				}
			);
			await when('I press k', () => reportPage.pressPreviousArgValBlock());
			await then(
				'the report scrolls to the first argument values block',
				async () => {
					await reportPage.expectHash(first.id);
					await reportPage.expectScrolledTo(first.id);
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Pressing t returns to the table of contents',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const first = requireCapability(
				fixture.argValItems[0],
				'Report payload contains no navigable argument values blocks.'
			);

			await given('I have moved away from the top of the report', async () => {
				await reportPage.pressNextArgValBlock();
				await reportPage.expectScrolledTo(first.id);
				await reportPage.expectScrolled();
			});
			await when('I press t', () => reportPage.pressTableOfContents());
			await then(
				'the report scrolls back to the table of contents',
				async () => {
					await reportPage.expectTableOfContentsHash();
					await reportPage.expectScrolledToTableOfContents();
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Pressing p pairs the gain columns for the current test block',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const testBlock = requireCapability(
				fixture.testBlocks[0],
				'Report payload contains no test blocks.'
			);
			const first = requireCapability(
				fixture.argValItems[0],
				'Report payload contains no navigable argument values blocks.'
			);

			await given('I have moved into the first test block', async () => {
				await reportPage.pressNextArgValBlock();
				await reportPage.expectScrolledTo(first.id);
			});
			await when('I press p', () => reportPage.pressPairGainColumns());
			await then(
				'the first test block reports its gain columns as paired',
				() => reportPage.expectGainColumnsPaired(testBlock.id)
			);
			await when('I press p again', () => reportPage.pressPairGainColumns());
			await then(
				'the first test block reports its gain columns as unpaired',
				() => reportPage.expectGainColumnsUnpaired(testBlock.id)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The Next and Prev buttons move between argument values blocks',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const [first, second] = fixture.argValItems;
			const last = requireCapability(
				fixture.argValItems.at(-1),
				'Report payload contains no navigable argument values blocks.'
			);

			requireCapability(
				second,
				'Report payload has fewer than two navigable argument values blocks.'
			);

			await given('I open a rendered report', () => reportPage.expectLoaded());
			await then('the first argument values block cannot go back', () =>
				reportPage.expectPreviousArgValButtonDisabled(first.id)
			);
			await when('I use its Next button', () =>
				reportPage.clickNextArgValButton(first.id)
			);
			await then('the report scrolls to the second argument values block', () =>
				reportPage.expectScrolledTo(second.id)
			);
			await when("I use that block's Prev button", () =>
				reportPage.clickPreviousArgValButton(second.id)
			);
			await then('the report scrolls to the first argument values block', () =>
				reportPage.expectScrolledTo(first.id)
			);
			await and('the last argument values block cannot go forward', () =>
				reportPage.expectNextArgValButtonDisabled(last.id)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a table cell opens the log preview for that result',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const cell = requireCapability(
				fixture.cells[0],
				'Report payload contains no table cell carrying a result id.'
			);

			await given('the report payload lists a table cell with a result', () =>
				expect(cell.resultId).toBeGreaterThan(0)
			);
			await when('I click that cell', () =>
				reportPage.openLogPreview(cell.recordId, cell.resultId)
			);
			await then('the log preview opens for that result', () =>
				reportPage.expectLogPreviewLinks(fixture.runId, cell.resultId)
			);
		}
	);

	test(
		'The log preview does not change the report URL',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const cell = requireCapability(
				fixture.cells[0],
				'Report payload contains no table cell carrying a result id.'
			);
			let urlBefore = '';

			await given('I open a rendered report', () => {
				urlBefore = reportPage.currentUrl();
				expect(urlBefore).toContain('/report');
			});
			await when('I click a table cell with a result', () =>
				reportPage.openLogPreview(cell.recordId, cell.resultId)
			);
			await then('the report URL is unchanged', () =>
				expect(reportPage.currentUrl()).toBe(urlBefore)
			);
			await when('I close the log preview', () => reportPage.closeLogPreview());
			await then('the report URL is still unchanged', () =>
				expect(reportPage.currentUrl()).toBe(urlBefore)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The log preview links to the log, run and result pages for the clicked cell',
		{ tag: ['@report', '@needs-report'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const cell = requireCapability(
				fixture.cells[0],
				'Report payload contains no table cell carrying a result id.'
			);

			await given('I click a table cell with a result', () =>
				reportPage.openLogPreview(cell.recordId, cell.resultId)
			);
			await then('the preview links to the log, the run and the result', () =>
				reportPage.expectLogPreviewLinks(fixture.runId, cell.resultId)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Selecting charts for stacked mode records them in the URL',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const [first, second] = fixture.recordItems;

			requireCapability(
				second,
				'Report payload has fewer than two records with charts.'
			);

			await given('I open a rendered report', () => reportPage.expectLoaded());
			await when('I add two records to the stacked selection', async () => {
				await reportPage.addRecordToStacked(first.id);
				await reportPage.addRecordToStacked(second.id);
			});
			await then('the URL lists both records as selected', () =>
				reportPage.expectSearchParamValues('selected-records', [
					first.id,
					second.id
				])
			);
			await and('the page reports two charts selected', () =>
				reportPage.expectSelectedChartCount(2)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Opening the stacked drawer keeps the selection in the URL',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const [first, second] = fixture.recordItems;

			requireCapability(
				second,
				'Report payload has fewer than two records with charts.'
			);

			await given(
				'I have added two records to the stacked selection',
				async () => {
					await reportPage.addRecordToStacked(first.id);
					await reportPage.addRecordToStacked(second.id);
					await reportPage.expectSelectedChartCount(2);
				}
			);
			await when('I open the stacked drawer', () =>
				reportPage.openStackedDrawer()
			);
			await then(
				'the stacked chart is shown and the URL records the open drawer',
				() => reportPage.expectSearchParam('stacked-drawer', '1')
			);
			await when('I reload the page', async () => {
				await page.reload();
				await reportPage.expectLoaded();
			});
			await then(
				'the stacked chart is shown again with the same selection',
				async () => {
					await reportPage.expectStackedDrawerOpen();
					await reportPage.expectSearchParamValues('selected-records', [
						first.id,
						second.id
					]);
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Toggling the run details mode is reflected in the URL',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const { reportPage } = await openRenderedReport(page);

			await given('I open a rendered report', () =>
				reportPage.expectRunDetailsFullMode()
			);
			await when('I toggle the run details mode', () =>
				reportPage.toggleRunDetailsMode()
			);
			await then('the URL records the short mode', () =>
				reportPage.expectSearchParam('isFullMode', '0')
			);
			await when('I reload the page', async () => {
				await page.reload();
				await reportPage.expectLoaded();
			});
			await then('the run details are still in the short mode', () =>
				reportPage.expectRunDetailsShortMode()
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A report link restores the configuration, the detail mode and the selected records',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const reportPage = new RunReportPage(page);
			const fixture = await reportFixture(page, requireManifest());
			const [first, second] = fixture.recordItems;

			requireCapability(
				second,
				'Report payload has fewer than two records with charts.'
			);

			const search = new URLSearchParams({ isFullMode: '0' });
			search.append('selected-records', first.id);
			search.append('selected-records', second.id);

			await given(
				'a link that pins a config, the short detail mode and two selected records',
				() => expect(fixture.configId).toBeGreaterThan(0)
			);
			await when('I open that link', async () => {
				await reportPage.goto(fixture.runId, fixture.configId, {
					search: search.toString()
				});
				await reportPage.expectLoaded();
			});
			await then('the report is rendered in the short detail mode', () =>
				reportPage.expectRunDetailsShortMode()
			);
			await and('the page reports two charts selected', () =>
				reportPage.expectSelectedChartCount(2)
			);
			await and(
				'the link still carries every parameter it was opened with',
				async () => {
					await reportPage.expectParams({
						config: String(fixture.configId),
						isFullMode: '0'
					});
					await reportPage.expectSearchParamValues('selected-records', [
						first.id,
						second.id
					]);
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Report controls preserve the configuration and the selected records',
		{ tag: ['@report', '@needs-report', '@url-params'] },
		async ({ page }) => {
			const { reportPage, fixture } = await openRenderedReport(page);
			const testBlock = requireCapability(
				fixture.testBlocks[0],
				'Report payload contains no test blocks.'
			);
			const [first, second] = fixture.recordItems;

			requireCapability(
				second,
				'Report payload has fewer than two records with charts.'
			);

			const pinned = ['config', 'selected-records'];

			await given(
				'I have added two records to the stacked selection',
				async () => {
					await reportPage.addRecordToStacked(first.id);
					await reportPage.addRecordToStacked(second.id);
					await reportPage.expectSelectedChartCount(2);
				}
			);
			await when('I toggle the run details mode', () =>
				reportPage.expectParamsUnchangedWhile(pinned, async () => {
					await reportPage.toggleRunDetailsMode();
					await reportPage.expectSearchParam('isFullMode', '0');
				})
			);
			await then('the config and both selected records are still pinned', () =>
				reportPage.expectSearchParamValues('selected-records', [
					first.id,
					second.id
				])
			);
			await when('I collapse a test block in the table of contents', () =>
				reportPage.expectParamsUnchangedWhile(pinned, async () => {
					await reportPage.toggleTocEntry(testBlock.id);
					await reportPage.expectBlockCollapsedInUrl(testBlock.id);
				})
			);
			await then('the config and both selected records are still pinned', () =>
				reportPage.expectSearchParamValues('selected-records', [
					first.id,
					second.id
				])
			);
		}
	);
});
