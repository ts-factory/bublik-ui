/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { adminEmail, adminPassword } from '../support/session';

class LoginPage {
	/**
	 * `scope` narrows the form lookups, e.g. to the sign-in dialog that opens
	 * over a page; it defaults to the whole login page.
	 */
	constructor(
		private readonly page: Page,
		private readonly scope: Page | Locator = page
	) {}

	get emailInput(): Locator {
		return this.scope.locator('input[name="email"]');
	}

	get passwordInput(): Locator {
		return this.scope.locator('input[name="password"]');
	}

	get submitButton(): Locator {
		return this.scope.getByRole('button', { name: 'Sign in' });
	}

	async goto(searchParams?: string): Promise<void> {
		await this.page.goto(`auth/login${searchParams ? `?${searchParams}` : ''}`);
		await expect(this.emailInput).toBeVisible({ timeout: 30_000 });
	}

	async signIn(email: string, password: string): Promise<void> {
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.submitButton.click();
	}

	async signInAsAdmin(): Promise<void> {
		await this.page.goto('auth/login');
		await this.signIn(adminEmail(), adminPassword());
		await this.page.waitForURL('**/dashboard', { timeout: 15_000 });
	}
}

export { LoginPage };
