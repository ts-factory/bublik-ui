/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';
import type { APIRequestContext, Page, Request } from '@playwright/test';

import { HISTORY_SEARCH_FORM_PARAMS, HistoryPage } from './pages/history-page';
import type {
	DiscriminatingHistoryBadge,
	HistoryMode
} from './pages/history-page';
import { ProjectPicker } from './pages/project-picker';
import { requireCapability } from './support/capabilities';
import { badgeTextToPayload, projectIdByName } from './support/e2e-data';
import { and, given, then, when } from './support/gherkin';
import { requireManifest } from './support/manifest';
import {
	firstHistoryTestPath,
	historyBadgeCase,
	historyDateRange,
	historyEmptyDate,
	historyMeasurementTestPath,
	historyProjectPair
} from './support/sample-cases';

const HISTORY = { tag: ['@history'] };
const HISTORY_SMOKE = { tag: ['@history', '@smoke'] };
const HISTORY_MEASUREMENTS = { tag: ['@history', '@needs-measurements'] };
const HISTORY_URL = { tag: ['@history', '@url-params'] };
const HISTORY_URL_MEASUREMENTS = {
	tag: ['@history', '@url-params', '@needs-measurements']
};

function dateRange(): Record<string, string> {
	return historyDateRange(requireManifest());
}

function measurementCase() {
	return requireCapability(
		historyMeasurementTestPath(requireManifest()),
		'Fixture manifest contains no test path with measurements.'
	);
}

function badgeCase() {
	return requireCapability(
		historyBadgeCase(requireManifest()),
		'Fixture manifest contains no test path whose results span several parameter sets.'
	);
}

async function openBadgeCase(
	historyPage: HistoryPage,
	mode: 'linear' | 'aggregation'
): Promise<void> {
	await historyPage.gotoWithTestPath(badgeCase().testPath, {
		...dateRange(),
		mode
	});
	await historyPage.expectModeReady(mode);
	await historyPage.expectHasResults();
}

function waitForHistoryResponse(page: Page, testPath?: string) {
	return page.waitForResponse((response) => {
		const url = new URL(response.url());
		const isHistory =
			url.pathname.endsWith('/api/v2/history/') ||
			url.pathname.endsWith('/api/v2/history/grouped/');

		return (
			isHistory && (!testPath || url.searchParams.get('test_name') === testPath)
		);
	});
}

test.describe('History Page', () => {
	test.setTimeout(60_000);

	test(
		'Searching by test path queries the history API',
		HISTORY_SMOKE,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given('the fixture manifest describes a tested path', () =>
				expect(testPath).toBeTruthy()
			);

			const historyResponsePromise = page.waitForResponse((response) => {
				const url = new URL(response.url());

				return (
					url.pathname.endsWith('/api/v2/history/') &&
					url.searchParams.get('test_name') === testPath
				);
			});

			await when('I search the history for that test path', async () => {
				await historyPage.goto();
				await historyPage.expectReady();
				await historyPage.openGlobalSearchForm();
				await historyPage.globalSearchForm.fillTestPath(testPath);
				await historyPage.globalSearchForm.applySearch();
			});
			await then('the history request is sent for that test path', async () => {
				const historyResponse = await historyResponsePromise;
				expect(historyResponse.ok()).toBeTruthy();
			});
			await and('the search form closes', () =>
				historyPage.globalSearchForm.expectHidden()
			);
		}
	);

	test(
		'The applied search is reflected in the URL',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given('I open the history page', async () => {
				await historyPage.goto();
				await historyPage.expectReady();
			});
			await when('I search the history for a test path', async () => {
				await historyPage.openGlobalSearchForm();
				await historyPage.globalSearchForm.fillTestPath(testPath);
				await historyPage.globalSearchForm.applySearch();
			});
			await then('the test path is recorded in the URL', () =>
				expect(page).toHaveURL(
					new RegExp(`testName=${encodeURIComponent(testPath)}`),
					{ timeout: 15_000 }
				)
			);
		}
	);

	test(
		'The verdict lookup type can be switched to regex',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);

			await given('I open the global search form', async () => {
				await historyPage.goto();
				await historyPage.expectReady();
				await historyPage.openGlobalSearchForm();
			});
			await when('I switch the verdict lookup to regex', () =>
				historyPage.globalSearchForm.setVerdictLookup('Regex')
			);
			await then('the regex lookup is selected', () =>
				expect(
					historyPage.globalSearchForm.verdictLookupOption('Regex')
				).toHaveAttribute('aria-checked', 'true', { timeout: 15_000 })
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Disabling the verdict lookup disables the verdict field',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const form = historyPage.globalSearchForm;

			await given('I open the global search form', async () => {
				await historyPage.goto();
				await historyPage.expectReady();
				await historyPage.openGlobalSearchForm();
				await form.expectVerdictFieldAcceptsInput();
			});
			await when('I switch the verdict lookup off', () =>
				form.setVerdictLookup('None')
			);
			await then('the verdict field is disabled', () =>
				form.expectVerdictFieldDisabled()
			);
		}
	);

	test(
		'Resetting the search form clears the narrowing fields but keeps the test path',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const form = historyPage.globalSearchForm;
			const testPath = firstHistoryTestPath();

			await given(
				'I open the global search form with a test path and a hash entered',
				async () => {
					await historyPage.goto();
					await historyPage.expectReady();
					await historyPage.openGlobalSearchForm();
					await form.fillTestPath(testPath);
					await form.fillHash('3c447d65a665c0eee17a0a20827e9');
					await expect(form.testPathInput).toHaveValue(testPath);
				}
			);
			await when('I reset the form', () => form.reset());
			await then('the hash is cleared', () =>
				expect(form.hashInput).toHaveValue('', { timeout: 15_000 })
			);
			await and('the test path is kept', () =>
				expect(form.testPathInput).toHaveValue(testPath)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A search without a test path is rejected',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const form = historyPage.globalSearchForm;

			await given('I open the global search form', async () => {
				await historyPage.goto();
				await historyPage.expectReady();
				await historyPage.openGlobalSearchForm();
			});
			await when('I clear the test section', () => form.clearTestSection());
			await and('I apply the search', () => form.applySearch());
			await then('the form reports that the test name is required', () =>
				form.expectError('Test name is required')
			);
			await and('the search form stays open', () => form.expectVisible());
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A search with no obtained result types is rejected',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const form = historyPage.globalSearchForm;
			const testPath = firstHistoryTestPath();

			await given(
				'I open the global search form with a test path entered',
				async () => {
					await historyPage.goto();
					await historyPage.expectReady();
					await historyPage.openGlobalSearchForm();
					await form.fillTestPath(testPath);
				}
			);
			await when('I clear the result section', () => form.clearResultSection());
			await and('I apply the search', () => form.applySearch());
			await then(
				'the form reports that an obtained result type is required',
				() => form.expectError('Select at least one obtained result type')
			);
		}
	);

	test('Ctrl+Enter submits the search form', HISTORY, async ({ page }) => {
		const historyPage = new HistoryPage(page);
		const form = historyPage.globalSearchForm;
		const testPath = firstHistoryTestPath();

		await given(
			'I open the global search form with a test path entered',
			async () => {
				await historyPage.goto();
				await historyPage.expectReady();
				await historyPage.openGlobalSearchForm();
				await form.fillTestPath(testPath);
			}
		);
		await when('I press Ctrl+Enter', () => form.submitWithKeyboard());
		await then('the test path is recorded in the URL', () =>
			expect(page).toHaveURL(
				new RegExp(`testName=${encodeURIComponent(testPath)}`),
				{ timeout: 15_000 }
			)
		);
		await and('the search form closes', () => form.expectHidden());
	});

	test(
		'The applied query is described by the filter legend',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given('the fixture manifest describes a tested path', () =>
				expect(testPath).toBeTruthy()
			);
			await when('I open the history page for that path', async () => {
				await historyPage.gotoWithTestPath(testPath, {
					...dateRange(),
					results: 'PASSED;FAILED'
				});
				await historyPage.expectReady();
			});
			await then('the filter legend names the test path', () =>
				expect(
					historyPage.root.getByText('Test Path:', { exact: true })
				).toBeVisible({ timeout: 30_000 })
			);
			await and('the filter legend names the obtained results', () =>
				expect(
					historyPage.root.getByText('Obtained Result:', { exact: true })
				).toBeVisible()
			);
		}
	);

	test(
		"The results table lists the test path's results with log and run links",
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given('the fixture manifest describes a tested path', () =>
				expect(testPath).toBeTruthy()
			);
			await when('I open the history page for that path', async () => {
				await historyPage.gotoWithTestPath(testPath, dateRange());
				await historyPage.expectModeReady('linear');
			});
			await then('the results table lists results', () =>
				historyPage.expectHasResults()
			);
			await and('each result links to its log and its run', async () => {
				const firstRow = historyPage.rows().first();

				await expect(
					firstRow.getByRole('link', { name: 'Log' }).first()
				).toBeVisible();
				await expect(
					firstRow.getByRole('link', { name: 'Run' }).first()
				).toBeVisible();
			});
		}
	);

	test(
		'The substring filter narrows the results already loaded',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given('I search the history for a test path', async () => {
				await historyPage.gotoWithTestPath(testPath, dateRange());
				await historyPage.expectModeReady('linear');
				await historyPage.expectHasResults();
			});
			await when('I type a substring that no result matches', async () => {
				await expect(historyPage.substringFilter).toBeVisible({
					timeout: 30_000
				});
				await historyPage.substringFilter.fill('no-result-matches-this');
			});
			await then('the substring filter holds that value', () =>
				expect(historyPage.substringFilter).toHaveValue(
					'no-result-matches-this'
				)
			);
			await and('no results are left in the table', () =>
				expect(historyPage.rows()).toHaveCount(0, { timeout: 30_000 })
			);
		}
	);

	test(
		'Paging through the results records the page in the URL',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given(
				'I open the history page for a path with more results than one page',
				async () => {
					await historyPage.gotoWithTestPath(testPath, {
						...dateRange(),
						pageSize: '10'
					});
					await historyPage.expectModeReady('linear');
					await historyPage.expectHasResults();
					await expect(historyPage.pagination).toBeVisible({
						timeout: 30_000
					});
				}
			);
			await when('I open the next page of results', () =>
				historyPage.openNextPage()
			);
			await then('the second page is recorded in the URL', () =>
				expect(page).toHaveURL(/[?&]page=2\b/, { timeout: 15_000 })
			);
		}
	);

	test(
		'The legend counts the runs and results the query returned',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given('the fixture manifest describes a tested path', () =>
				expect(testPath).toBeTruthy()
			);
			await when('I open the history page for that path', async () => {
				await historyPage.gotoWithTestPath(testPath, dateRange());
				await historyPage.expectModeReady('linear');
				await historyPage.expectHasResults();
			});
			await then('the legend counts at least one run', () =>
				historyPage.expectLegendCountAtLeast('runs', 1)
			);
			await and('the legend counts at least one test result', () =>
				historyPage.expectLegendCountAtLeast('results', 1)
			);
		}
	);

	test(
		'Reset Filter restores the defaults but keeps the test path',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given(
				'I open the history page for a path with a hash filter applied',
				async () => {
					await historyPage.gotoWithTestPath(testPath, {
						...dateRange(),
						hash: '3c447d65a665c0eee17a0a20827e9'
					});
					await historyPage.expectReady();
					await expect(page).toHaveURL(/hash=/);
				}
			);
			await when('I press Reset Filter', () =>
				historyPage.resetFilterButton.click()
			);
			await then('the hash is dropped from the URL', () =>
				expect(page).not.toHaveURL(/hash=3c447d65a665c0eee17a0a20827e9/, {
					timeout: 15_000
				})
			);
			await and('the test path is kept in the URL', () =>
				expect(page).toHaveURL(
					new RegExp(`testName=${encodeURIComponent(testPath)}`)
				)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A test path with no matching results shows the empty state',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();
			const emptyDate = requireCapability(
				historyEmptyDate(requireManifest()),
				'Fixture manifest contains no day without runs.'
			);

			await given('a tested path and a day the lab did not run it', () =>
				expect(emptyDate).toBeTruthy()
			);
			await when(
				'I open the history page for that path on that day',
				async () => {
					await historyPage.gotoWithTestPath(testPath, {
						startDate: emptyDate,
						finishDate: emptyDate
					});
					await historyPage.expectReady();
				}
			);
			await then('the page reports that there are no results', () =>
				historyPage.expectNoResults()
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Opening history without a test path asks for one',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);

			await when('I open the history page with no query', async () => {
				await historyPage.goto();
				await historyPage.expectReady();
			});
			await then('the page reports that a test name is missing', () =>
				historyPage.expectNoTestName()
			);
		}
	);

	test(
		'Grouped results list each parameter hash with the results it produced',
		HISTORY,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given('the fixture manifest describes a tested path', () =>
				expect(testPath).toBeTruthy()
			);
			await when(
				'I open the history page for that path in the aggregation mode',
				async () => {
					await historyPage.gotoWithTestPath(testPath, {
						...dateRange(),
						mode: 'aggregation'
					});
					await historyPage.expectModeReady('aggregation');
				}
			);
			await then('the grouped table is listed by parameters and hash', () =>
				expect(page.getByText('Parameters/Hash')).toBeVisible({
					timeout: 60_000
				})
			);
			await and('each group lists the results it produced', async () => {
				await historyPage.expectHasResults();
				await expect(page.getByText('Results/Log')).toBeVisible();
			});
		}
	);

	test(
		'A grouped result links to the log of that result',
		HISTORY,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given(
				'I open the history page for a path in the aggregation mode',
				async () => {
					await historyPage.gotoWithTestPath(testPath, {
						...dateRange(),
						mode: 'aggregation'
					});
					await historyPage.expectModeReady('aggregation');
					await historyPage.expectHasResults();
				}
			);
			await when('I follow the first numbered result link', () =>
				historyPage.rows().first().locator('a[href*="/log/"]').first().click()
			);
			await then('the log page for that result is open', () =>
				expect(page).toHaveURL(/\/log\/\d+/, { timeout: 30_000 })
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a parameter badge narrows the history list to the matching results',
		HISTORY,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			let before = 0;
			let badge!: DiscriminatingHistoryBadge;

			await given(
				'I open the history page for a path with more than one parameter set',
				async () => {
					await openBadgeCase(historyPage, 'linear');
					before = await historyPage.rows().count();
					badge = await historyPage.pickDiscriminatingBadge('parameters');
				}
			);
			await when(
				'I click a parameter badge that only some of the listed results carry',
				() => historyPage.clickBadge('parameters', badge.rowIndex, badge.text)
			);
			await then('only the results carrying that parameter are listed', () =>
				historyPage.expectRowsNarrowedTo('parameters', badge.text, before)
			);
			await and('the badge is shown as selected', () =>
				historyPage.expectBadgeSelected('parameters', badge.text)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a metadata badge narrows the history list to that configuration',
		HISTORY,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			let before = 0;
			let badge!: DiscriminatingHistoryBadge;

			await given(
				'I open the history page for a path with more than one parameter set',
				async () => {
					await openBadgeCase(historyPage, 'linear');
					before = await historyPage.rows().count();
					badge = await historyPage.pickDiscriminatingBadge('metadata');
				}
			);
			await when(
				'I click a metadata badge that only some of the listed results carry',
				() => historyPage.clickBadge('metadata', badge.rowIndex, badge.text)
			);
			await then('only the results carrying that metadata are listed', () =>
				historyPage.expectRowsNarrowedTo('metadata', badge.text, before)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking an obtained result badge narrows the history list to that result',
		HISTORY,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			let before = 0;
			let badge!: DiscriminatingHistoryBadge;

			await given(
				'I open the history page for a path with more than one obtained result',
				async () => {
					await openBadgeCase(historyPage, 'linear');
					before = await historyPage.rows().count();
					badge = await historyPage.pickDiscriminatingBadge(
						'obtained-results',
						'result'
					);
				}
			);
			await when('I click the obtained result badge of a listed result', () =>
				historyPage.clickBadge('obtained-results', badge.rowIndex, badge.text)
			);
			await then('only the results of that type are listed', () =>
				historyPage.expectRowsNarrowedTo(
					'obtained-results',
					badge.text,
					before,
					'result'
				)
			);
		}
	);

	test(
		'Badge filtering in the history list leaves the query untouched',
		HISTORY_URL,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			let badge!: DiscriminatingHistoryBadge;
			let sentRequest = true;

			await given(
				'I open the history page for a path with more than one parameter set',
				async () => {
					await openBadgeCase(historyPage, 'linear');
					badge = await historyPage.pickDiscriminatingBadge('parameters');
				}
			);
			let queryBefore = '';

			await when('I click a parameter badge', async () => {
				queryBefore = new URL(page.url()).search;

				sentRequest = await historyPage.sentHistoryRequestWithin(() =>
					historyPage.clickBadge('parameters', badge.rowIndex, badge.text)
				);
			});
			await then('the URL is unchanged', () =>
				expect(new URL(page.url()).search).toBe(queryBefore)
			);
			await and('no history request was sent', () =>
				expect(sentRequest).toBe(false)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a parameter badge in the grouped table narrows it to the matching hashes',
		HISTORY,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			let before = 0;
			let badge!: DiscriminatingHistoryBadge;

			await given(
				'I open the history page for that path in the aggregation mode',
				async () => {
					await openBadgeCase(historyPage, 'aggregation');
					before = await historyPage.rows().count();
					badge = await historyPage.pickDiscriminatingBadge('results-log');
				}
			);
			await when('I click a parameter badge of the first group', () =>
				historyPage.clickBadge('results-log', badge.rowIndex, badge.text)
			);
			await then(
				'only the groups carrying that parameter are listed',
				async () => {
					await historyPage.expectRowsNarrowedTo(
						'results-log',
						badge.text,
						before
					);
					await expect
						.poll(() => historyPage.rows().count(), { timeout: 30_000 })
						.toBe(badge.matchingRows);
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Clicking a verdict badge in the grouped table narrows it to the groups reporting it',
		HISTORY,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			let before = 0;
			let badge!: DiscriminatingHistoryBadge;

			await given(
				'I open the history page for that path in the aggregation mode',
				async () => {
					await openBadgeCase(historyPage, 'aggregation');
					before = await historyPage.rows().count();
					badge = await historyPage.pickDiscriminatingBadge(
						'parameters-hash',
						'verdicts'
					);
				}
			);
			await when('I click a verdict badge of a group that reports one', () =>
				historyPage.clickBadge('parameters-hash', badge.rowIndex, badge.text)
			);
			await then('only the groups reporting that verdict are listed', () =>
				historyPage.expectRowsNarrowedTo(
					'parameters-hash',
					badge.text,
					before,
					'verdicts'
				)
			);
		}
	);

	test(
		'Selecting parameters from the grouped table context menu applies them to the query',
		HISTORY_URL,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const testPath = badgeCase().testPath;
			let parameters: string[] = [];
			let requests: Request[] = [];

			await given(
				'I open the history page for that path in the aggregation mode',
				async () => {
					await openBadgeCase(historyPage, 'aggregation');
					parameters = (await historyPage.badgeTextsByRow('results-log'))[0]
						.map(badgeTextToPayload)
						.filter(Boolean);
					expect(parameters.length).toBeGreaterThan(0);
				}
			);
			await when(
				"I right-click a group's parameters and choose Select parameters",
				async () => {
					requests = await historyPage.captureHistoryRequests(async () => {
						await historyPage.openCellContextMenu('results-log', 0);
						await historyPage.chooseContextMenuItem('Select parameters');
					});

					expect(requests.length).toBeGreaterThan(0);
				}
			);
			await then('those parameters are recorded in the URL', async () => {
				const applied = (
					new URL(page.url()).searchParams.get('parameters') ?? ''
				).split(';');

				for (const parameter of parameters) {
					expect(applied).toContain(parameter);
				}
			});
			await and(
				'the test path, the mode and the page size are still pinned',
				() =>
					historyPage.expectParams({
						testName: testPath,
						mode: 'aggregation',
						pageSize: '25'
					})
			);
			await and('the URL is back on the first page', () =>
				historyPage.expectParams({ page: '1' })
			);
			await and(
				'the history request carries the parameters as test args',
				() => {
					const sent = (
						new URL(requests[requests.length - 1].url()).searchParams.get(
							'test_args'
						) ?? ''
					).split(';');

					for (const parameter of parameters) {
						expect(sent).toContain(parameter);
					}
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		"Applying the search form replaces the badge filters with the form's own",
		HISTORY,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			let before = 0;

			await given(
				'I open the history page narrowed by a parameter badge',
				async () => {
					await openBadgeCase(historyPage, 'linear');
					before = await historyPage.rows().count();

					const badge = await historyPage.pickDiscriminatingBadge('parameters');
					await historyPage.clickBadge(
						'parameters',
						badge.rowIndex,
						badge.text
					);
					await historyPage.expectRowsNarrowedTo(
						'parameters',
						badge.text,
						before
					);
				}
			);
			await when('I open the search form and apply it unchanged', async () => {
				await historyPage.openGlobalSearchForm();
				await historyPage.globalSearchForm.applySearch();
				await historyPage.globalSearchForm.expectHidden();
			});
			await then('every result of the query is listed again', () =>
				expect
					.poll(() => historyPage.rows().count(), { timeout: 60_000 })
					.toBe(before)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Trend charts render for a test path with measurements',
		HISTORY_MEASUREMENTS,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const measurements = measurementCase();

			await given(
				'the fixture manifest describes a path with measurements',
				() => expect(measurements.testPath).toBeTruthy()
			);
			await when(
				'I open the history page for that path in the trend charts mode',
				async () => {
					await historyPage.gotoWithTestPath(measurements.testPath, {
						...dateRange(),
						mode: 'measurements'
					});
				}
			);
			await then('the trend charts are rendered', () =>
				historyPage.expectModeReady('measurements')
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Series charts render one block per measurement result',
		HISTORY_MEASUREMENTS,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const measurements = measurementCase();

			await given(
				'the fixture manifest describes a path with measurements',
				() => expect(measurements.testPath).toBeTruthy()
			);
			await when(
				'I open the history page for that path in the series charts mode',
				async () => {
					await historyPage.gotoWithTestPath(measurements.testPath, {
						...dateRange(),
						mode: 'measurements-by-iteration'
					});
				}
			);
			await then('the series charts are rendered', () =>
				historyPage.expectModeReady('measurements-by-iteration')
			);
		}
	);

	test(
		'Series charts can be narrowed by the chart name filter',
		HISTORY_MEASUREMENTS,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const measurements = measurementCase();

			await given(
				'I open the history page for a path with measurements in the series charts mode',
				async () => {
					await historyPage.gotoWithTestPath(measurements.testPath, {
						...dateRange(),
						mode: 'measurements-by-iteration'
					});
					await historyPage.expectModeReady('measurements-by-iteration');
				}
			);
			await when('I pick the first chart in the Charts filter', async () => {
				await page.getByRole('button', { name: 'Charts', exact: true }).click();
				await page.locator('[role="option"]').first().click();
			});
			await then('the picked chart is recorded in the URL', () =>
				expect(page).toHaveURL(/parametersByResultName=/, { timeout: 15_000 })
			);
		}
	);

	test(
		'Adding trend charts to the combined view opens the stacked page',
		HISTORY_MEASUREMENTS,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const measurements = measurementCase();

			await given(
				'I open the history page for a path with measurements in the trend charts mode',
				async () => {
					await historyPage.gotoWithTestPath(measurements.testPath, {
						...dateRange(),
						mode: 'measurements'
					});
					await historyPage.expectModeReady('measurements');
					await expect(historyPage.charts().first()).toBeVisible({
						timeout: 60_000
					});
				}
			);
			await when('I add the first chart to the combined view', () =>
				historyPage.addChartToCombined(0)
			);
			await and('I open the stacked view from the selection', () =>
				historyPage.openStackedFromSelection()
			);
			await then(
				'the stacked mode is open with the selected chart in the URL',
				async () => {
					await expect(page).toHaveURL(/combinedPlots=/, { timeout: 30_000 });
					await expect(historyPage.root).toHaveAttribute(
						'data-history-mode',
						'measurements-combined'
					);
				}
			);
		}
	);

	test(
		'The stacked view asks for a selection when none was made',
		HISTORY,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const measurements = measurementCase();

			await when(
				'I open the history page in the stacked charts mode with nothing selected',
				async () => {
					await historyPage.gotoWithTestPath(measurements.testPath, {
						...dateRange(),
						mode: 'measurements-combined'
					});
					await historyPage.expectReady();
				}
			);
			await then('the page reports that no plots were selected', () =>
				expect(page.getByText('You have not selected plots')).toBeVisible({
					timeout: 60_000
				})
			);
		}
	);

	test.describe('The history page renders every result mode', () => {
		test.slow();

		async function expectModeRendered(page: Page, mode: HistoryMode) {
			const historyPage = new HistoryPage(page);
			const measurements = measurementCase();

			await given(
				'the fixture manifest describes a path with measurements',
				() => expect(measurements.testPath).toBeTruthy()
			);
			await when(
				'I open the history page for that path in the given mode',
				() =>
					historyPage.gotoWithTestPath(measurements.testPath, {
						...dateRange(),
						mode
					})
			);
			await then('the history page reports that mode as its layout', () =>
				historyPage.expectModeReady(mode)
			);
		}

		/* eslint-disable playwright/expect-expect */
		test('linear', HISTORY, ({ page }) => expectModeRendered(page, 'linear'));

		test('aggregation', HISTORY, ({ page }) =>
			expectModeRendered(page, 'aggregation')
		);

		test('measurements', HISTORY, ({ page }) =>
			expectModeRendered(page, 'measurements')
		);

		test('measurements-by-iteration', HISTORY, ({ page }) =>
			expectModeRendered(page, 'measurements-by-iteration')
		);

		test('measurements-combined', HISTORY, ({ page }) =>
			expectModeRendered(page, 'measurements-combined')
		);
		/* eslint-enable playwright/expect-expect */
	});

	test(
		'Selecting a project in the sidebar scopes the history results to it',
		HISTORY,
		async ({ page, request }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const picker = new ProjectPicker(page);
			const pair = requireCapability(
				historyProjectPair(requireManifest()),
				'Fixture manifest contains no two projects with distinct test paths.'
			);
			let projectId = 0;

			await given(
				'two projects with test paths that do not overlap',
				async () => {
					expect(pair.selected.testPath).not.toBe(pair.other.testPath);
					projectId = requireCapability(
						await projectIdByName(request, pair.selected.project),
						`Project "${pair.selected.project}" is not registered.`
					);
				}
			);
			await when('I select the first project in the sidebar', async () => {
				await historyPage.goto();
				await historyPage.expectReady();
				await picker.select(projectId);
			});

			const historyResponse = waitForHistoryResponse(
				page,
				pair.selected.testPath
			);

			await and("I open the history page for that project's test path", () =>
				historyPage.gotoWithTestPath(pair.selected.testPath, {
					...dateRange(),
					project: String(projectId)
				})
			);
			await then('the history request carries that project', async () => {
				const response = await historyResponse;

				expect(new URL(response.url()).searchParams.get('project')).toBe(
					String(projectId)
				);
			});
			await and('the results table lists results', async () => {
				await historyPage.expectModeReady('linear');
				await historyPage.expectHasResults();
			});
			await when(
				"I open the history page for the other project's test path",
				() =>
					historyPage.gotoWithTestPath(pair.other.testPath, {
						...dateRange(),
						project: String(projectId)
					})
			);
			await then('the page reports that there are no results', () =>
				historyPage.expectNoResults()
			);
			await when('I select All projects in the sidebar', async () => {
				await picker.selectAll();
			});
			await then('the results table lists results', async () => {
				await historyPage.expectModeReady('linear');
				await historyPage.expectHasResults();
			});
		}
	);

	test.describe('Every history mode stays scoped to the selected project', () => {
		test.slow();

		async function expectModeScoped(
			page: Page,
			request: APIRequestContext,
			mode: HistoryMode
		) {
			const historyPage = new HistoryPage(page);
			const picker = new ProjectPicker(page);
			const measurements = measurementCase();
			let projectId = 0;

			await given(
				'a project with a test path that reports measurements',
				async () => {
					projectId = requireCapability(
						await projectIdByName(request, measurements.project),
						`Project "${measurements.project}" is not registered.`
					);
				}
			);
			await when('I select that project in the sidebar', async () => {
				await historyPage.goto();
				await historyPage.expectReady();
				await picker.select(projectId);
			});

			const historyResponse = waitForHistoryResponse(
				page,
				measurements.testPath
			);

			await and('I open the history page for that path in the given mode', () =>
				historyPage.gotoWithTestPath(measurements.testPath, {
					...dateRange(),
					mode,
					project: String(projectId)
				})
			);
			await then('the history request carries that project', async () => {
				const response = await historyResponse;

				expect(new URL(response.url()).searchParams.get('project')).toBe(
					String(projectId)
				);
				await historyPage.expectModeReady(mode);
			});
		}

		/* eslint-disable playwright/expect-expect */
		test('List Of Results', HISTORY, ({ page, request }) =>
			expectModeScoped(page, request, 'linear')
		);

		test('Groups Of Results', HISTORY, ({ page, request }) =>
			expectModeScoped(page, request, 'aggregation')
		);

		test('Trend Charts', HISTORY, ({ page, request }) =>
			expectModeScoped(page, request, 'measurements')
		);
		/* eslint-enable playwright/expect-expect */
	});

	async function scopedCase(request: APIRequestContext) {
		const pair = requireCapability(
			historyProjectPair(requireManifest()),
			'Fixture manifest contains no two projects with distinct test paths.'
		);
		const projectId = requireCapability(
			await projectIdByName(request, pair.selected.project),
			`Project "${pair.selected.project}" is not registered.`
		);

		return { testPath: pair.selected.testPath, projectId: String(projectId) };
	}

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A history link restores the query it pins',
		HISTORY_URL,
		async ({ page, request }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			let link: Record<string, string> = {};

			await given(
				'a link that pins a test path, a date range, a layout and a page size',
				async () => {
					const { testPath, projectId } = await scopedCase(request);

					link = {
						testName: testPath,
						...dateRange(),
						mode: 'linear',
						pageSize: '10',
						results: 'PASSED;FAILED',
						project: projectId
					};
				}
			);
			await when('I open that link', () => historyPage.gotoWithParams(link));
			await then(
				'the results table lists the results of that query',
				async () => {
					await historyPage.expectModeReady('linear');
					await historyPage.expectHasResults();
				}
			);
			await and(
				'the link still carries every parameter it was opened with',
				() => historyPage.expectParams(link)
			);
		}
	);

	test(
		"The history request translates the URL parameters into the API's names",
		HISTORY_URL,
		async ({ page, request }) => {
			const historyPage = new HistoryPage(page);
			const range = dateRange();
			let link: Record<string, string> = {};

			await given(
				'a link that pins every parameter the API renames',
				async () => {
					const { testPath, projectId } = await scopedCase(request);

					link = {
						testName: testPath,
						parameters: 'time_limit=30;pkt_size=1500',
						runData: 'medford;x86_64',
						startDate: range.startDate,
						finishDate: range.finishDate,
						resultProperties: 'expected;unexpected',
						results: 'PASSED;FAILED',
						revisionExpr: 'rev > 100',
						runIds: '1;2',
						verdictLookup: 'regex',
						pageSize: '10',
						project: projectId
					};
				}
			);

			const historyRequest = historyPage.waitForHistoryRequest();

			await when('I open that link', () => historyPage.gotoWithParams(link));
			await then(
				'the history request carries each of them under its API name',
				async () => {
					const sent = new URL((await historyRequest).url()).searchParams;

					expect(sent.get('test_name')).toBe(link.testName);
					expect(sent.get('test_args')).toBe(link.parameters);
					expect(sent.get('tags')).toBe(link.runData);
					expect(sent.get('from_date')).toBe(link.startDate);
					expect(sent.get('to_date')).toBe(link.finishDate);
					expect(sent.get('result_types')).toBe(link.resultProperties);
					expect(sent.get('result_statuses')).toBe(link.results);
					expect(sent.get('rev_expr')).toBe(link.revisionExpr);
					expect(sent.get('run_ids')).toBe(link.runIds);
					expect(sent.get('verdict_lookup')).toBe(link.verdictLookup);
					expect(sent.get('page_size')).toBe(link.pageSize);
					expect(sent.get('project')).toBe(link.project);
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Applying the search form writes the whole query into the URL',
		HISTORY_URL,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const form = historyPage.globalSearchForm;
			const testPath = firstHistoryTestPath();
			const hash = '3c447d65a665c0eee17a0a20827e9';

			await given(
				'I open the global search form with a test path, a hash and a verdict',
				async () => {
					await historyPage.goto();
					await historyPage.expectReady();
					await historyPage.openGlobalSearchForm();
					await form.fillTestPath(testPath);
					await form.fillHash(hash);
					await form.addVerdicts(['timeout']);
				}
			);
			await when('I apply the search', () => form.applySearch());
			await then('the values I entered are recorded in the URL', () =>
				historyPage.expectParams({
					testName: testPath,
					hash,
					verdict: 'timeout'
				})
			);
			await and('every search form parameter is written to the URL', () =>
				historyPage.expectParamsPresent([
					...HISTORY_SEARCH_FORM_PARAMS,
					'mode',
					'page',
					'pageSize'
				])
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'An unknown mode in the link falls back to the list of results',
		HISTORY_URL,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given('a link whose mode is not a mode the page renders', () =>
				expect(testPath).toBeTruthy()
			);
			await when('I open that link', () =>
				historyPage.gotoWithParams({
					testName: testPath,
					...dateRange(),
					mode: 'not-a-mode'
				})
			);
			await then('the page renders the list of results', () =>
				historyPage.expectModeReady('linear')
			);
			await and('the URL still carries the unknown mode', () =>
				historyPage.expectParams({ mode: 'not-a-mode' })
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Paging records the page and page size and survives a reload',
		HISTORY_URL,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const testPath = firstHistoryTestPath();

			await given(
				'I open the history page for a path with more results than one page',
				async () => {
					await historyPage.gotoWithTestPath(testPath, {
						...dateRange(),
						pageSize: '10'
					});
					await historyPage.expectModeReady('linear');
					await historyPage.expectHasResults();
					await expect(historyPage.pagination).toBeVisible({
						timeout: 30_000
					});
				}
			);
			await when('I open the next page of results', () =>
				historyPage.openNextPage()
			);
			await then('the page and the page size are recorded in the URL', () =>
				historyPage.expectParams({ page: '2', pageSize: '10' })
			);
			await when('I reload the page', () => page.reload());
			await then(
				'the page and the page size are still recorded in the URL',
				() => historyPage.expectParams({ page: '2', pageSize: '10' })
			);
			await and(
				'the results table lists the results of that query',
				async () => {
					await historyPage.expectModeReady('linear');
					await historyPage.expectHasResults();
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Submitting the search form resets the page but keeps the mode, page size and project',
		HISTORY_URL,
		async ({ page, request }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const form = historyPage.globalSearchForm;
			let projectId = '';

			await given(
				'I open the second page of a scoped history query in the aggregation mode',
				async () => {
					const scoped = await scopedCase(request);
					projectId = scoped.projectId;

					await historyPage.gotoWithParams({
						testName: scoped.testPath,
						...dateRange(),
						mode: 'aggregation',
						page: '2',
						pageSize: '10',
						project: projectId
					});
					await historyPage.expectReady();
					await historyPage.expectParams({ page: '2' });
					await historyPage.openGlobalSearchForm();
					await form.fillTestPath(scoped.testPath);
				}
			);
			await when('I apply the search again', () => form.applySearch());
			await then('the URL is back on the first page', () =>
				historyPage.expectParams({ page: '1' })
			);
			await and(
				'the mode, the page size and the project are still pinned',
				() =>
					historyPage.expectParams({
						mode: 'aggregation',
						pageSize: '10',
						project: projectId
					})
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Reset Filter keeps the test path, dates, mode and project and clears the rest',
		HISTORY_URL,
		async ({ page, request }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const range = dateRange();
			let pinned: Record<string, string> = {};

			await given(
				'I open a scoped history query narrowed by hash, parameters and verdict',
				async () => {
					const { testPath, projectId } = await scopedCase(request);

					pinned = {
						testName: testPath,
						startDate: range.startDate,
						finishDate: range.finishDate,
						mode: 'linear',
						project: projectId
					};

					await historyPage.gotoWithParams({
						...pinned,
						hash: '3c447d65a665c0eee17a0a20827e9',
						parameters: 'time_limit=30',
						runData: 'medford',
						verdict: 'timeout'
					});
					await historyPage.expectReady();
					await historyPage.expectParams({
						hash: '3c447d65a665c0eee17a0a20827e9'
					});
				}
			);
			await when('I press Reset Filter', () =>
				historyPage.resetFilterButton.click()
			);
			await then(
				'the test path, the dates, the mode and the project are still pinned',
				() => historyPage.expectParams(pinned)
			);
			await and('the narrowing parameters are cleared', () =>
				historyPage.expectParams({
					hash: '',
					parameters: '',
					runData: '',
					verdict: ''
				})
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The chart name filter survives a reload',
		HISTORY_URL_MEASUREMENTS,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const measurements = measurementCase();

			await given(
				'I open the history page for a path with measurements in the series charts mode',
				async () => {
					await historyPage.gotoWithTestPath(measurements.testPath, {
						...dateRange(),
						mode: 'measurements-by-iteration'
					});
					await historyPage.expectModeReady('measurements-by-iteration');
				}
			);
			await when('I pick the first chart in the Charts filter', async () => {
				await page.getByRole('button', { name: 'Charts', exact: true }).click();
				await page.locator('[role="option"]').first().click();
				await historyPage.expectParamsPresent(['parametersByResultName']);
			});
			await and('I reload the page', () => page.reload());
			await then('the picked chart is still recorded in the URL', () =>
				historyPage.expectParamsPresent(['parametersByResultName'])
			);
			await and('the series charts are rendered', () =>
				historyPage.expectModeReady('measurements-by-iteration')
			);
		}
	);

	test(
		'Adding trend charts to the combined view records them in the URL',
		HISTORY_URL_MEASUREMENTS,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const measurements = measurementCase();

			await given(
				'I open the history page for a path with measurements in the trend charts mode',
				async () => {
					await historyPage.gotoWithTestPath(measurements.testPath, {
						...dateRange(),
						mode: 'measurements'
					});
					await historyPage.expectModeReady('measurements');
					await expect
						.poll(() => historyPage.charts().count(), { timeout: 60_000 })
						.toBeGreaterThan(1);
				}
			);
			await when('I add two charts to the combined view', async () => {
				await historyPage.addChartToCombined(0);
				await historyPage.addChartToCombined(1);
			});
			await then(
				'both chart ids are recorded in the URL as combined plots',
				() =>
					expect
						.poll(
							() =>
								(historyPage.paramValue('combinedPlots') ?? '')
									.split(';')
									.filter(Boolean).length,
							{ timeout: 15_000, message: 'chart ids in combinedPlots' }
						)
						.toBe(2)
			);
			await and('the chart group is recorded in the URL', () =>
				historyPage.expectParamsPresent(['chart-group'])
			);
		}
	);

	test(
		'The substring filter is not recorded in the URL and is lost on a reload',
		HISTORY_URL,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const testPath = badgeCase().testPath;
			let before = 0;

			await given('I open a history query with results listed', async () => {
				await openBadgeCase(historyPage, 'linear');
				before = await historyPage.rows().count();
				expect(before).toBeGreaterThan(0);
			});
			await when('I narrow the results with the substring filter', async () => {
				await expect(historyPage.substringFilter).toBeVisible({
					timeout: 30_000
				});
				await historyPage.substringFilter.fill('no-result-matches-this');
			});
			await then('fewer results are listed', () =>
				expect
					.poll(() => historyPage.rows().count(), {
						timeout: 30_000,
						message: 'rows after the substring filter'
					})
					.toBeLessThan(before)
			);
			await and('the query parameters are unchanged', () =>
				historyPage.expectParams({
					testName: testPath,
					mode: 'linear',
					substring: null,
					filter: null
				})
			);
			await when('I reload the page', async () => {
				await page.reload();
				await historyPage.expectModeReady('linear');
			});
			await then('every result of the query is listed again', () =>
				expect
					.poll(() => historyPage.rows().count(), {
						timeout: 60_000,
						message: 'rows after the reload'
					})
					.toBe(before)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Switching the history mode from the sidebar keeps the query it was showing',
		HISTORY_URL,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const range = dateRange();
			const testPath = badgeCase().testPath;

			await given('I open a history query in the list of results', async () => {
				await historyPage.gotoWithTestPath(testPath, {
					...range,
					mode: 'linear'
				});
				await historyPage.expectModeReady('linear');
			});
			await when(
				'I switch to the grouped results from the sidebar',
				async () => {
					await page.getByRole('link', { name: 'Groups Of Results' }).click();
					await historyPage.expectModeReady('aggregation');
				}
			);
			await then('the mode is recorded in the URL', () =>
				historyPage.expectParams({ mode: 'aggregation' })
			);
			await and('the test path and the dates are still pinned', () =>
				historyPage.expectParams({
					testName: testPath,
					startDate: range.startDate,
					finishDate: range.finishDate
				})
			);
		}
	);

	test(
		'The parameter filter of the series charts repeats one key per parameter',
		HISTORY_URL_MEASUREMENTS,
		async ({ page }) => {
			test.slow();

			const historyPage = new HistoryPage(page);
			const measurements = measurementCase();

			await given(
				'I open the history page for a path with measurements in the series charts mode',
				async () => {
					await historyPage.gotoWithTestPath(measurements.testPath, {
						...dateRange(),
						mode: 'measurements-by-iteration'
					});
					await historyPage.expectModeReady('measurements-by-iteration');
				}
			);
			await when('I pick a parameter in the Parameters filter', async () => {
				await page
					.getByRole('button', { name: 'Parameters', exact: true })
					.click();
				await page.locator('[role="option"]').first().click();
				await historyPage.expectParamsPresent(['parametersByResultFilter']);
			});
			await then(
				'the parameter filter is recorded in the URL as a repeated key',
				() =>
					expect
						.poll(
							() => historyPage.paramValues('parametersByResultFilter').length,
							{
								timeout: 15_000,
								message: 'repeated parametersByResultFilter keys'
							}
						)
						.toBeGreaterThan(0)
			);
			await when('I reload the page', () => page.reload());
			await then('the parameter filter is still recorded in the URL', () =>
				historyPage.expectParamsPresent(['parametersByResultFilter'])
			);
			await and('the series charts are rendered', () =>
				historyPage.expectModeReady('measurements-by-iteration')
			);
		}
	);

	test(
		"The history request translates the expression filters into the API's names",
		HISTORY_URL,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const range = dateRange();
			const link = {
				testName: firstHistoryTestPath(),
				startDate: range.startDate,
				finishDate: range.finishDate,
				tagExpr: 'medford',
				branchExpr: 'master',
				labelExpr: 'nightly',
				testArgExpr: 'pkt_size > 100',
				verdictExpr: 'timeout',
				runProperties: 'notcompromised'
			};

			await given(
				'a link that pins every expression filter the form offers',
				() => expect(Object.values(link).every(Boolean)).toBe(true)
			);

			const historyRequest = historyPage.waitForHistoryRequest();

			await when('I open that link', () => historyPage.gotoWithParams(link));
			await then(
				'the history request carries each expression under its API name',
				async () => {
					const sent = new URL((await historyRequest).url()).searchParams;

					expect(sent.get('tag_expr')).toBe(link.tagExpr);
					expect(sent.get('branch_expr')).toBe(link.branchExpr);
					expect(sent.get('label_expr')).toBe(link.labelExpr);
					expect(sent.get('test_arg_expr')).toBe(link.testArgExpr);
					expect(sent.get('verdict_expr')).toBe(link.verdictExpr);
					expect(sent.get('run_properties')).toBe(link.runProperties);
				}
			);
			await and('the link still carries every expression unchanged', () =>
				historyPage.expectParams(link)
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'A history link is read back into the search form',
		HISTORY_URL,
		async ({ page }) => {
			const historyPage = new HistoryPage(page);
			const form = historyPage.globalSearchForm;
			const range = dateRange();
			const link = {
				testName: firstHistoryTestPath(),
				startDate: range.startDate,
				finishDate: range.finishDate,
				hash: 'abc123',
				tagExpr: 'medford'
			};

			await given(
				'a link that pins a test path, a hash and a tag expression',
				() => expect(link.hash).toBe('abc123')
			);
			await when('I open that link and edit the search', async () => {
				await historyPage.gotoWithParams(link);
				await historyPage.expectReady();
				await historyPage.openGlobalSearchForm();
			});
			await then(
				'the form shows the test path, the hash and the tag expression the link pinned',
				async () => {
					await expect(form.testPathInput).toHaveValue(link.testName, {
						timeout: 15_000
					});
					await expect(form.hashInput).toHaveValue(link.hash);
					await expect(form.tagExpressionInput).toHaveValue(link.tagExpr);
				}
			);
		}
	);
});
