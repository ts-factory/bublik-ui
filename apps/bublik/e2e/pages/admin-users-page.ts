/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

interface CreateUserInput {
	email: string;
	firstName: string;
	lastName: string;
	password: string;
	passwordConfirm: string;
}

class AdminUsersPage {
	constructor(private readonly page: Page) {}

	get createUserButton(): Locator {
		return this.page.getByRole('button', { name: 'Create User' });
	}

	get dialog(): Locator {
		return this.page.getByRole('dialog');
	}

	async goto(search = ''): Promise<void> {
		await this.page.goto(`admin/users${search}`);
		await expect(this.createUserButton).toBeVisible({ timeout: 30_000 });
	}

	userRow(email: string): Locator {
		return this.page.getByRole('row').filter({
			has: this.page.getByRole('link', { name: email, exact: true })
		});
	}

	async expectUserListed(email: string): Promise<void> {
		await expect(
			this.page
				.getByRole('table')
				.getByRole('link', { name: email, exact: true })
		).toBeVisible({
			timeout: 30_000
		});
	}

	async expectUserStatus(email: string, status: string): Promise<void> {
		await expect(
			this.userRow(email).getByTestId('tw-badge').filter({ hasText: status })
		).toBeVisible({ timeout: 30_000 });
	}

	async expectUserJoinedDate(email: string): Promise<void> {
		await expect(
			this.userRow(email)
				.getByRole('cell')
				.filter({
					hasText: /^\d{4}\.\d{2}\.\d{2}$/
				})
		).toBeVisible({ timeout: 30_000 });
	}

	async deactivateUser(email: string): Promise<void> {
		await this.userRow(email)
			.getByRole('button', { name: 'Deactivate user' })
			.click();
		const confirm = this.page.getByRole('alertdialog');
		await expect(confirm).toBeVisible({ timeout: 15_000 });
		await confirm.getByRole('button', { name: 'Deactivate' }).click();
	}

	async expectNotice(text: string): Promise<void> {
		await expect(this.page.getByText(text).first()).toBeVisible({
			timeout: 15_000
		});
	}

	async openCreateUserForm(): Promise<void> {
		await this.createUserButton.click();
		await expect(this.dialog).toBeVisible({ timeout: 15_000 });
	}

	async submitCreateUser(input: CreateUserInput): Promise<void> {
		await this.dialog.getByLabel('Email').fill(input.email);
		await this.dialog.getByLabel('First name').fill(input.firstName);
		await this.dialog.getByLabel('Last name').fill(input.lastName);
		await this.dialog
			.getByLabel('Password', { exact: true })
			.fill(input.password);
		await this.dialog
			.getByLabel('Password Confirm')
			.fill(input.passwordConfirm);
		await this.dialog.getByRole('button', { name: 'Create' }).click();
	}

	async closeDialog(): Promise<void> {
		await this.dialog.getByRole('button', { name: 'Close' }).click();
		await expect(this.dialog).toBeHidden({ timeout: 15_000 });
	}
}

export { AdminUsersPage };
export type { CreateUserInput };
