/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { expect, test } from './support/test';

import { AdminTokensPage } from './pages/admin-tokens-page';
import { then, when } from './support/gherkin';

test.describe('Admin Access Tokens Page', () => {
	// eslint-disable-next-line playwright/expect-expect
	test(
		'The admin tokens page lists tokens with their owner',
		{ tag: ['@admin', '@tokens'] },
		async ({ page }) => {
			const tokensPage = new AdminTokensPage(page);

			await when('I open the admin tokens page', () => tokensPage.goto());
			await then('each listed token shows the account it acts as', () =>
				tokensPage.expectOwnerColumn()
			);
		}
	);

	test(
		'The admin tokens table never shows a token value',
		{ tag: ['@admin', '@tokens'] },
		async ({ page }) => {
			const tokensPage = new AdminTokensPage(page);

			await when('I open the admin tokens page', () => tokensPage.goto());
			await then(
				'only token handles are shown, never a full token',
				async () => {
					const text = await tokensPage.tableText();
					// A handle is the marker plus a few characters and an ellipsis; a
					// full token is far longer. Nothing here may match the long form.
					expect(text).not.toMatch(/bpat_[A-Za-z0-9_-]{20,}/);
				}
			);
		}
	);
});
