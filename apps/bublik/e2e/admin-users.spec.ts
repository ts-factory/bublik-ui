/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, test } from './support/test';

import { AdminUsersPage } from './pages/admin-users-page';
import { and, given, then, when } from './support/gherkin';
import { adminEmail } from './support/session';

test.describe('Admin Users Page', () => {
	// eslint-disable-next-line playwright/expect-expect
	test(
		'The users table lists the signed-in administrator',
		{ tag: ['@admin'] },
		async ({ page }) => {
			const usersPage = new AdminUsersPage(page);

			await when('I open the users page', () => usersPage.goto());
			await then("the administrator's own account is listed", () =>
				usersPage.expectUserListed(adminEmail())
			);
		}
	);

	test(
		'The create-user form refuses a mismatched password confirmation',
		{ tag: ['@admin'] },
		async ({ page }) => {
			const usersPage = new AdminUsersPage(page);
			const email = `e2e-never-created-${Date.now()}@example.invalid`;

			await given('I open the create-user form', async () => {
				await usersPage.goto();
				await usersPage.openCreateUserForm();
			});
			await when('I submit it with two different passwords', () =>
				usersPage.submitCreateUser({
					email,
					firstName: 'E2E',
					lastName: 'Mismatch',
					password: 'correct-horse-1',
					passwordConfirm: 'correct-horse-2'
				})
			);
			await then('the form reports that the passwords do not match', () =>
				expect(
					page.getByText('The passwords did not match').first()
				).toBeVisible({ timeout: 15_000 })
			);
			await when('I close the form', () => usersPage.closeDialog());
			await then('no user was created', async () => {
				await expect(page.getByText(email)).toHaveCount(0);
			});
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'The users table shows the administrator as active',
		{ tag: ['@admin'] },
		async ({ page }) => {
			const usersPage = new AdminUsersPage(page);

			await when('I open the users page', () => usersPage.goto());
			await then(
				"the administrator's row shows the status Active and a joined date",
				async () => {
					await usersPage.expectUserStatus(adminEmail(), 'Active');
					await usersPage.expectUserJoinedDate(adminEmail());
				}
			);
		}
	);

	// eslint-disable-next-line playwright/expect-expect
	test(
		'Deactivating your own account is refused',
		{ tag: ['@admin'] },
		async ({ page }) => {
			const usersPage = new AdminUsersPage(page);

			await given('I open the users page', () => usersPage.goto());
			await when('I deactivate my own account and confirm', () =>
				usersPage.deactivateUser(adminEmail())
			);
			await then('I am told that users cannot deactivate themselves', () =>
				usersPage.expectNotice('Users cannot deactivate themselves')
			);
			await and("the administrator's account is still listed as Active", () =>
				usersPage.expectUserStatus(adminEmail(), 'Active')
			);
		}
	);
});
