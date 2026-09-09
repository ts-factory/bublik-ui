/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';

import { and, given, then, when } from './support/gherkin';
import { urlParams } from './support/url-params';

test.describe('Admin Tools', () => {
	test(
		'The Flower page embeds the task monitor',
		{ tag: ['@admin'] },
		async ({ page }) => {
			await when('I open the Flower page', () => page.goto('admin/flower'));
			await then('the task monitor frame is embedded', () =>
				expect(page.locator('iframe[title="flower-page"]')).toBeVisible({
					timeout: 30_000
				})
			);
		}
	);

	test(
		'The analytics page loads without error',
		{ tag: ['@admin'] },
		async ({ page }) => {
			await when('I open the analytics page', () =>
				page.goto('admin/analytics')
			);
			await then('the page shell is rendered', () =>
				expect(page.getByTestId('tw-app-shell')).toBeVisible({
					timeout: 30_000
				})
			);
		}
	);

	test(
		'An analytics link keeps its snake case parameters',
		{ tag: ['@admin', '@url-params'] },
		async ({ page }) => {
			const link = {
				event_type: 'navigation',
				path: '/dashboard',
				page_size: '200'
			};

			await given(
				'a link that pins an event type, a path and a page size',
				() => expect(link.page_size).toBe('200')
			);
			await when('I open that link', () =>
				page.goto(`admin/analytics?${new URLSearchParams(link)}`)
			);
			await then('the page shell is rendered', () =>
				expect(page.getByTestId('tw-app-shell')).toBeVisible({
					timeout: 30_000
				})
			);
			await and(
				'the link still carries every parameter it was opened with',
				() => urlParams(page).expect(link)
			);
		}
	);
});
