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

	async goto(): Promise<void> {
		await this.page.goto('admin/users');
		await expect(this.createUserButton).toBeVisible({ timeout: 30_000 });
	}

	async expectUserListed(email: string): Promise<void> {
		await expect(this.page.getByText(email).first()).toBeVisible({
			timeout: 30_000
		});
	}

	async openCreateUserForm(): Promise<void> {
		await this.createUserButton.click();
		await expect(this.dialog).toBeVisible({ timeout: 15_000 });
	}

	/** Fills and submits; the form is client-validated, so this may not post. */
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
