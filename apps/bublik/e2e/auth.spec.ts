/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
/* Implements apps/bublik/e2e/features/auth.feature */
import { expect, test } from '@playwright/test';

import { adminEmail, adminPassword, LoginPage } from './pages/login-page';
import { and, given, then, when } from './support/gherkin';

// The browser projects share a signed-in storage state; these scenarios are
// about signing in, so they start from a clean context.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
	test('Signing in with valid credentials opens the dashboard', async ({
		page
	}) => {
		const loginPage = new LoginPage(page);

		await given('I am signed out and on the login page', () => loginPage.goto());
		await when('I sign in with the administrator credentials', () =>
			loginPage.signIn(adminEmail(), adminPassword())
		);
		await then('the dashboard is open', () =>
			expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
		);
	});

	test('Signing in with the wrong password is refused', async ({ page }) => {
		const loginPage = new LoginPage(page);

		await given('I am signed out and on the login page', () => loginPage.goto());
		await when('I sign in with a wrong password', () =>
			loginPage.signIn(adminEmail(), 'definitely-not-the-password')
		);
		await then('the sign-in is reported as failed', () =>
			expect(page.getByText('Failed to login!').first()).toBeVisible({
				timeout: 30_000
			})
		);
		await and('I am still on the login page', () =>
			expect(page).toHaveURL(/\/auth\/login/)
		);
	});

	test('An address that is not an email is rejected before submitting', async ({
		page
	}) => {
		const loginPage = new LoginPage(page);

		await given('I am signed out and on the login page', () => loginPage.goto());
		await when('I try to sign in with something that is not an email address', () =>
			loginPage.signIn('not-an-email', 'some-password')
		);
		await then('the form reports the invalid field', () =>
			expect(page.getByTestId('input-error-message').first()).toBeVisible({
				timeout: 15_000
			})
		);
		await and('I am still on the login page', () =>
			expect(page).toHaveURL(/\/auth\/login/)
		);
	});

	test('The login page offers password recovery', async ({ page }) => {
		const loginPage = new LoginPage(page);

		await given('I am signed out and on the login page', () => loginPage.goto());
		await when('I follow the forgot-password link', () =>
			page.getByRole('link', { name: 'Forgot password?' }).click()
		);
		await then('the password recovery page is open', () =>
			expect(page).toHaveURL(/\/auth\/forgot/, { timeout: 15_000 })
		);
	});
});
