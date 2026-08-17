/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/admin-misc.feature */
import { expect, test } from '@playwright/test';

import { then, when } from './support/gherkin';

test.describe('Admin Tools', () => {
	test('The Flower page embeds the task monitor', { tag: ['@admin'] }, async ({
		page
	}) => {
		await when('I open the Flower page', () => page.goto('admin/flower'));
		await then('the task monitor frame is embedded', () =>
			expect(page.locator('iframe[title="flower-page"]')).toBeVisible({
				timeout: 30_000
			})
		);
	});

	// The analytics entry is conditionally rendered, so this only asserts the
	// route renders its shell rather than any particular content.
	test('The analytics page loads without error', { tag: ['@admin'] }, async ({
		page
	}) => {
		await when('I open the analytics page', () => page.goto('admin/analytics'));
		await then('the page shell is rendered', () =>
			expect(page.getByTestId('tw-app-shell')).toBeVisible({ timeout: 30_000 })
		);
	});
});
