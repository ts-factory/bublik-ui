/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { expect, test } from './support/test';

import {
	AccessTokensSettings,
	TOKEN_VALUE_PATTERN
} from './pages/access-tokens-page';
import { and, given, then, when } from './support/gherkin';

/** Unique per run so repeat runs never collide on the live-name constraint. */
const tokenName = (label: string) => `e2e-${label}-${Date.now()}`;

test.describe('Access Tokens', () => {
	test(
		'Creating an access token shows its value exactly once',
		{ tag: ['@tokens'] },
		async ({ page }) => {
			const settings = new AccessTokensSettings(page);
			const name = tokenName('once');
			let value = '';

			await given('I open the access tokens settings', () => settings.goto());
			await when('I create a token that never expires', async () => {
				value = await settings.createToken(name);
			});
			await then(
				"the new token's value is shown with a warning that it will not be shown again",
				async () => {
					await expect(
						settings.revealDialog.getByText(
							'This is the only time this token will be shown.'
						)
					).toBeVisible();
					// The value appears in the token block, the MCP configuration and
					// the curl example, so all three copy buttons hand over a complete
					// snippet. Any one of them proves it was rendered.
					await expect(
						settings.revealDialog.getByText(value).first()
					).toBeVisible();
				}
			);
			await and('the dialog offers a copyable MCP client configuration', () =>
				expect(
					settings.revealDialog.getByRole('button', {
						name: 'Copy MCP configuration'
					})
				).toBeVisible()
			);
			await when('I dismiss the token value', () =>
				settings.dismissRevealDialog()
			);
			await then(
				'the token is listed by its handle and the value is gone from the page',
				async () => {
					await expect(settings.row(name)).toBeVisible();
					await expect(page.getByText(value)).toHaveCount(0);
				}
			);

			// Leave nothing behind.
			await settings.revoke(name, true);
		}
	);

	test(
		'The create-token form refuses an empty token name',
		{ tag: ['@tokens'] },
		async ({ page }) => {
			const settings = new AccessTokensSettings(page);

			await given('I open the access tokens settings', () => settings.goto());
			await and('I open the create-token form', () =>
				settings.openCreateForm()
			);
			await when('I submit it without a name', () =>
				settings.submitCreateForm('')
			);
			await then('the form reports that a name is required', () =>
				expect(
					settings.createDialog.getByText('Name must be provided!')
				).toBeVisible({ timeout: 15_000 })
			);
			await when('I close the create-token form', () =>
				settings.closeCreateForm()
			);
			await then('no token was created', async () => {
				await expect(settings.revealDialog).toBeHidden();
			});
		}
	);

	test(
		'Revoking an access token asks for confirmation and can be cancelled',
		{ tag: ['@tokens'] },
		async ({ page }) => {
			const settings = new AccessTokensSettings(page);
			const name = tokenName('revoke');

			await given('I open the access tokens settings', () => settings.goto());
			await and('I have a token to revoke', async () => {
				const value = await settings.createToken(name);
				expect(value).toMatch(TOKEN_VALUE_PATTERN);
				await settings.dismissRevealDialog();
			});
			await when('I ask to revoke it and cancel the confirmation', () =>
				settings.revoke(name, false)
			);
			await then('the token is still active', () =>
				settings.expectStatus(name, 'Active')
			);
			await when('I ask to revoke it and confirm', () =>
				settings.revoke(name, true)
			);
			await then('the token is listed as revoked', () =>
				settings.expectStatus(name, 'Revoked')
			);
		}
	);
});
