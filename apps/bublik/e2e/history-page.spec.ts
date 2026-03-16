/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { test, expect } from '@playwright/test';

import { HistoryPage } from './pages/history-page';
import { firstHistoryTestPath } from './support/sample-cases';

test.describe('History Page', () => {
	test('submits global search form and sends the expected history request', async ({
		page
	}) => {
		test.setTimeout(30_000);
		const historyPage = new HistoryPage(page);
		const testPath = firstHistoryTestPath();

		await historyPage.goto();
		await historyPage.expectReady();
		await historyPage.openGlobalSearchForm();
		await historyPage.globalSearchForm.fillTestPath(testPath);
		await historyPage.globalSearchForm.applySearch();

		await expect(page).toHaveURL(/\/history/, { timeout: 15_000 });
		await historyPage.globalSearchForm.expectHidden();
	});
});
