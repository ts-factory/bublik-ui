/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';

import { AdminUsersPage } from './pages/admin-users-page';
import { LoginPage } from './pages/login-page';
import { Sidebar } from './pages/sidebar';
import { and, given, then, when } from './support/gherkin';
import {
	encodeSidebarState,
	SIDEBAR_ALIASES,
	SIDEBAR_STATE_PARAM,
	sidebarState
} from './support/sidebar-state';
import { adminEmail, adminPassword } from './support/session';

test.use({ storageState: { cookies: [], origins: [] } });

/** A history search the sidebar remembers, to check sign out keeps it. */
const HISTORY_SEARCH = 'testName=sign-out-keeps-sidebar-state';

test.describe('Authentication', () => {
	test('Signing in with valid credentials opens the dashboard', async ({
		page
	}) => {
		const loginPage = new LoginPage(page);

		await given('I am signed out and on the login page', () =>
			loginPage.goto()
		);
		await when('I sign in with the administrator credentials', () =>
			loginPage.signIn(adminEmail(), adminPassword())
		);
		await then('the dashboard is open', () =>
			expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
		);
	});

	test('Signing in with the wrong password is refused', async ({ page }) => {
		const loginPage = new LoginPage(page);

		await given('I am signed out and on the login page', () =>
			loginPage.goto()
		);
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

		await given('I am signed out and on the login page', () =>
			loginPage.goto()
		);
		await when(
			'I try to sign in with something that is not an email address',
			() => loginPage.signIn('not-an-email', 'some-password')
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

		await given('I am signed out and on the login page', () =>
			loginPage.goto()
		);
		await when('I follow the forgot-password link', () =>
			page.getByRole('link', { name: 'Forgot password?' }).click()
		);
		await then('the password recovery page is open', () =>
			expect(page).toHaveURL(/\/auth\/forgot/, { timeout: 15_000 })
		);
	});

	test('Opening a protected page while signed out asks to sign in in place', async ({
		page
	}) => {
		const usersPage = new AdminUsersPage(page);
		const dialog = page.getByTestId('login-dialog');

		await given('I am signed out and open the users page', () =>
			page.goto('admin/users')
		);
		await then('I am asked to sign in', () =>
			expect(dialog).toBeVisible({ timeout: 30_000 })
		);
		await when('I sign in with the administrator credentials', () =>
			new LoginPage(page, dialog).signIn(adminEmail(), adminPassword())
		);
		await then('the sign-in dialog closes', () =>
			expect(dialog).toBeHidden({ timeout: 30_000 })
		);
		await and('I am still on the users page', () =>
			expect(page).toHaveURL(/\/admin\/users/)
		);
		await and("the administrator's own account is listed", () =>
			usersPage.expectUserListed(adminEmail())
		);
	});

	test('Dismissing the sign-in dialog leaves a page that needs it', async ({
		page
	}) => {
		const dialog = page.getByTestId('login-dialog');

		await given('I am signed out and open the users page directly', () =>
			page.goto('admin/users')
		);
		await then('I am told the page needs an administrator', () =>
			expect(
				dialog.getByText('To view this page you need to sign in as an admin.')
			).toBeVisible({ timeout: 30_000 })
		);
		await and(
			'the dialog offers a way back instead of a close button',
			async () => {
				await expect(
					dialog.getByRole('button', { name: 'Go to dashboard' })
				).toBeVisible();
				await expect(dialog.getByRole('button', { name: 'Close' })).toHaveCount(
					0
				);
			}
		);
		await when('I click outside the sign-in dialog', () =>
			page.mouse.click(5, 5)
		);
		await then('the sign-in dialog stays open', () =>
			expect(dialog).toBeVisible()
		);
		await when('I choose to go to the dashboard', () =>
			dialog.getByRole('button', { name: 'Go to dashboard' }).click()
		);
		await then('the dialog is gone', () => expect(dialog).toBeHidden());
		await and('with nowhere to go back to, the dashboard is open', () =>
			expect(page).toHaveURL(/\/dashboard/)
		);
	});

	test('Going back from a protected admin page returns to the previous page', async ({
		page
	}) => {
		const sidebar = new Sidebar(page);
		const dialog = page.getByTestId('login-dialog');

		await given('I open the dashboard', () => page.goto('dashboard'));
		await when('I open the users page from the admin sidebar', () =>
			sidebar.openAdminUsers()
		);
		await then('I am told the page needs an administrator', () =>
			expect(
				dialog.getByText('To view this page you need to sign in as an admin.')
			).toBeVisible({ timeout: 30_000 })
		);
		await and(
			'the dialog offers to go back instead of a close button',
			async () => {
				await expect(
					dialog.getByRole('button', { name: 'Go back' })
				).toBeVisible();
				await expect(dialog.getByRole('button', { name: 'Close' })).toHaveCount(
					0
				);
			}
		);
		await when('I click the back button', () =>
			dialog.getByRole('button', { name: 'Go back' }).click()
		);
		await then('the dashboard is open and the dialog is gone', async () => {
			await expect(dialog).toHaveCount(0);
			await expect(page).toHaveURL(/\/dashboard/);
		});
	});

	test('Public pages do not ask anonymous visitors to sign in', async ({
		page
	}) => {
		const sessionChecked = page.waitForResponse((response) =>
			response.url().includes('/auth/profile/info/')
		);

		await given('I am signed out and open the dashboard', () =>
			page.goto('dashboard')
		);
		await then('the dashboard is open without a sign-in dialog', async () => {
			// The session check is the request anonymous visitors always fail
			const response = await sessionChecked;
			expect(response.status()).toBe(403);
			await expect(page).toHaveURL(/\/dashboard/);
			await expect(page.getByTestId('login-dialog')).toHaveCount(0);
		});
	});

	test('Signing in from the sidebar keeps me on the page', async ({ page }) => {
		const sidebar = new Sidebar(page);
		const dialog = page.getByTestId('login-dialog');

		await given('I am signed out', async () => {
			await page.context().clearCookies();
		});
		await when('I open the help page', () => page.goto('help/faq'));
		await then('the sidebar offers to sign in', () =>
			sidebar.expectSignedOut()
		);
		await when('I choose Sign In in the sidebar', () =>
			sidebar.signInButton().click()
		);
		await then('the sign-in dialog opens without a reason note', async () => {
			await expect(dialog).toBeVisible({ timeout: 15_000 });
			await expect(
				dialog.getByText(/need to sign in|To view this page/)
			).toHaveCount(0);
		});
		await when('I click outside the sign-in dialog', () =>
			page.mouse.click(5, 5)
		);
		await then('the sign-in dialog closes', () =>
			expect(dialog).toHaveCount(0, { timeout: 15_000 })
		);
		await when('I choose Sign In in the sidebar again', () =>
			sidebar.signInButton().click()
		);
		await then('the sign-in dialog opens without a reason note', () =>
			expect(dialog).toBeVisible({ timeout: 15_000 })
		);
		await when('I sign in with the administrator credentials', () =>
			new LoginPage(page, dialog).signIn(adminEmail(), adminPassword())
		);
		await then('the sign-in dialog closes', () =>
			expect(dialog).toHaveCount(0, { timeout: 30_000 })
		);
		await and('I am still on the help page', () =>
			expect(page).toHaveURL(/\/help\/faq/)
		);
		await and('the sidebar shows who I am signed in as', () =>
			sidebar.expectSignedIn()
		);
	});

	test('Signing out from a protected page returns me to the dashboard signed out', async ({
		page
	}) => {
		const loginPage = new LoginPage(page);
		const usersPage = new AdminUsersPage(page);
		const sidebar = new Sidebar(page);

		// A session of its own: signing out ends it on the server, so it must
		// not be the minted one the other specs share.
		await given('I have signed in through the login page', () =>
			loginPage.signInAsAdmin()
		);
		await and(
			'I open the protected users page with a remembered history page',
			() =>
				usersPage.goto(
					`?${SIDEBAR_STATE_PARAM}=${encodeSidebarState({
						[SIDEBAR_ALIASES.historyLastLinear]: HISTORY_SEARCH
					})}`
				)
		);
		await and('the sidebar shows who I am signed in as', () =>
			sidebar.expectSignedIn()
		);
		await when('I choose Sign Out from the account menu', () =>
			sidebar
				.openAccountMenu()
				.then(() => sidebar.accountMenuItem('Sign Out').click())
		);
		await then('the dashboard is open', () =>
			expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
		);
		await and('the sign-in dialog is not open', () =>
			expect(page.getByTestId('login-dialog')).toHaveCount(0)
		);
		await and('the sidebar still remembers the history page', () =>
			sidebarState(page).expectAliasCarries(
				SIDEBAR_ALIASES.historyLastLinear,
				HISTORY_SEARCH
			)
		);
		await and('the sidebar offers to sign in', () => sidebar.expectSignedOut());
	});

	test('Signing out from a public page keeps me on it', async ({ page }) => {
		const loginPage = new LoginPage(page);
		const sidebar = new Sidebar(page);

		// A session of its own, as in the scenario above
		await given('I have signed in through the login page', () =>
			loginPage.signInAsAdmin()
		);
		await and('I open the help page', () => page.goto('help/faq'));
		await and('the sidebar shows who I am signed in as', () =>
			sidebar.expectSignedIn()
		);
		await when('I choose Sign Out from the account menu', () =>
			sidebar
				.openAccountMenu()
				.then(() => sidebar.accountMenuItem('Sign Out').click())
		);
		await then('I am still on the help page', () =>
			expect(page).toHaveURL(/\/help\/faq/)
		);
		await and('the sign-in dialog is not open', () =>
			expect(page.getByTestId('login-dialog')).toHaveCount(0)
		);
		await and('the sidebar offers to sign in', () => sidebar.expectSignedOut());
	});
});
