/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/help.feature */
import { expect, test } from '@playwright/test';

import { and, then, when } from './support/gherkin';

test.describe('Help Page', () => {
	test('The help page shows the FAQ and the deployment info', async ({
		page
	}) => {
		await when('I open the help page', async () => {
			await page.goto('help/faq');
			await expect(page).toHaveURL(/\/help\/faq/);
		});
		await then('the FAQ section is shown', () =>
			expect(page.getByText('FAQ', { exact: true }).first()).toBeVisible({
				timeout: 30_000
			})
		);
		// The deploy info card prints the deployed revisions as "API: …"/"UI: …".
		await and('the deployment information is shown', () =>
			expect(page.getByText(/^UI:/).first()).toBeVisible({ timeout: 30_000 })
		);
	});
});
