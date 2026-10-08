/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* eslint-disable playwright/expect-expect */
import { expect, test } from './support/test';

import { EmailActivationPage } from './pages/email-activation-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { and, given, then, when } from './support/gherkin';

test.use({ storageState: { cookies: [], origins: [] } });

/** Route parameters the backend has never issued, so every token is stale. */
const USER_ID = '42';
const STALE_TOKEN = 'e2e-stale-token';

test.describe('Password reset link', () => {
	test('The reset link opens the new password form without signing in', async ({
		page
	}) => {
		const resetPage = new ResetPasswordPage(page);

		await given('a reset link for a user and a token', () =>
			expect(STALE_TOKEN).not.toBe('')
		);
		await when('I open that link', () => resetPage.goto(USER_ID, STALE_TOKEN));
		await then('the new password form is shown', () => resetPage.expectReady());
		await and('the address keeps the user and the token', () =>
			expect(page).toHaveURL(
				new RegExp(
					`/auth/forgot_password/password_reset/${USER_ID}/${STALE_TOKEN}$`
				)
			)
		);
	});

	test('Submitting a new password with a stale token is refused in place', async ({
		page
	}) => {
		const resetPage = new ResetPasswordPage(page);

		await given(
			'the new password form is open from a reset link with a stale token',
			async () => {
				await resetPage.goto(USER_ID, STALE_TOKEN);
				await resetPage.expectReady();
			}
		);
		await when('I submit a new password', () =>
			resetPage.submit('e2e-new-password')
		);
		await then('the reset is reported as failed', () =>
			resetPage.expectRejected()
		);
		await and('I am still on the reset link', () =>
			expect(page).toHaveURL(
				new RegExp(
					`/auth/forgot_password/password_reset/${USER_ID}/${STALE_TOKEN}$`
				)
			)
		);
	});
});

test.describe('Email activation link', () => {
	test('A stale activation link reports the failure and stays put', async ({
		page
	}) => {
		const activationPage = new EmailActivationPage(page);

		await given('an activation link for a user and a stale token', () =>
			expect(STALE_TOKEN).not.toBe('')
		);
		await when('I open that link', () =>
			activationPage.goto(USER_ID, STALE_TOKEN)
		);
		await then('the page reports that it is verifying the email', () =>
			activationPage.expectVerifying()
		);
		await and('the verification is reported as failed', () =>
			activationPage.expectRejected()
		);
		await and(
			'the address keeps the user, the token and the trailing slash',
			() =>
				expect(page).toHaveURL(
					new RegExp(`/auth/register/activate/${USER_ID}/${STALE_TOKEN}/$`)
				)
		);
	});
});
