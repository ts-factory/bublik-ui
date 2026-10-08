/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

/**
 * `/auth/forgot_password/password_reset/:userId/:resetToken` — the page a
 * recovery email links to. The token is only read when the form is submitted.
 */
class ResetPasswordPage {
	constructor(private readonly page: Page) {}

	async goto(userId: string, resetToken: string): Promise<void> {
		await this.page.goto(
			`auth/forgot_password/password_reset/${userId}/${resetToken}`
		);
		await expect(this.page).toHaveURL(
			new RegExp(
				`/auth/forgot_password/password_reset/${userId}/${resetToken}$`
			)
		);
	}

	get passwordInput(): Locator {
		return this.page.locator('input[name="new_password"]');
	}

	get confirmInput(): Locator {
		return this.page.locator('input[name="new_password_confirm"]');
	}

	get submitButton(): Locator {
		return this.page.getByRole('button', { name: 'Reset', exact: true });
	}

	async expectReady(): Promise<void> {
		await expect(this.passwordInput).toBeVisible({ timeout: 30_000 });
		await expect(this.confirmInput).toBeVisible();
		await expect(this.submitButton).toBeVisible();
	}

	async submit(password: string): Promise<void> {
		await this.passwordInput.fill(password);
		await this.confirmInput.fill(password);
		await this.submitButton.click();
	}

	async expectRejected(): Promise<void> {
		await expect(
			this.page.getByText('Failed to reset password!').first()
		).toBeVisible({ timeout: 30_000 });
	}
}

export { ResetPasswordPage };
