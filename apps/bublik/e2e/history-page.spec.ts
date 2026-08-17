/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/history.feature */
import { test, expect } from '@playwright/test';

import { HistoryPage } from './pages/history-page';
import { and, given, then, when } from './support/gherkin';
import { firstHistoryTestPath } from './support/sample-cases';

test.describe('History Page', () => {
	test.setTimeout(60_000);

	test(
		'Searching by test path queries the history API',
		{ tag: ['@smoke'] },
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

	test('The applied search is reflected in the URL', async ({ page }) => {
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
	});

	test('The verdict lookup type can be switched to regex', async ({ page }) => {
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
				historyPage.globalSearchForm.verdictLookupGroup.getByRole('radio', {
					name: /regex/i
				})
			).toHaveAttribute('aria-checked', 'true', { timeout: 15_000 })
		);
	});

	test('Resetting the search form clears the narrowing fields but keeps the test path', async ({
		page
	}) => {
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
	});

	test('The substring filter narrows the results already loaded', async ({
		page
	}) => {
		const historyPage = new HistoryPage(page);
		const testPath = firstHistoryTestPath();
		const substringFilter = page.getByPlaceholder('Substring filter');

		await given('I search the history for a test path', async () => {
			await historyPage.goto();
			await historyPage.expectReady();
			await historyPage.openGlobalSearchForm();
			await historyPage.globalSearchForm.fillTestPath(testPath);
			await historyPage.globalSearchForm.applySearch();
			await historyPage.globalSearchForm.expectHidden();
		});
		await when('I type a substring that no result matches', async () => {
			await expect(substringFilter).toBeVisible({ timeout: 30_000 });
			await substringFilter.fill('no-result-matches-this');
		});
		await then('the substring filter holds that value', () =>
			expect(substringFilter).toHaveValue('no-result-matches-this')
		);
	});

	test.describe('The history page renders every result mode', () => {
		// Assertions are encapsulated by HistoryPage.
		// eslint-disable-next-line playwright/expect-expect
		test('aggregation', async ({ page }) => {
			const historyPage = new HistoryPage(page);

			await when('I open the history page in the given mode', () =>
				historyPage.goto('mode=aggregation')
			);
			await then('the history page is ready', () => historyPage.expectReady());
		});

		// Assertions are encapsulated by HistoryPage.
		// eslint-disable-next-line playwright/expect-expect
		test('linear', async ({ page }) => {
			const historyPage = new HistoryPage(page);

			await when('I open the history page in the given mode', () =>
				historyPage.goto('mode=linear')
			);
			await then('the history page is ready', () => historyPage.expectReady());
		});
	});
});
