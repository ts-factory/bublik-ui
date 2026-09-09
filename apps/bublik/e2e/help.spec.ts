/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';

import { then, when } from './support/gherkin';

test.describe('Help Page', () => {
	test('The help page shows the FAQ', async ({ page }) => {
		await when('I open the help page', async () => {
			await page.goto('help/faq');
			await expect(page).toHaveURL(/\/help\/faq/);
		});
		await then('the FAQ section is shown', () =>
			expect(page.getByText('FAQ', { exact: true }).first()).toBeVisible({
				timeout: 30_000
			})
		);
	});
});
