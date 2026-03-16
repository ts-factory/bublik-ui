/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Page } from '@playwright/test';

class LoginPage {
	constructor(private readonly page: Page) {}

	async signInAsAdmin(): Promise<void> {
		await this.page.goto('auth/login');
		await this.page.locator('input[name="email"]').fill('admin@bublik.com');
		await this.page.locator('input[name="password"]').fill('admin');
		await this.page.getByRole('button', { name: 'Sign in' }).click();
		await this.page.waitForURL('**/dashboard', { timeout: 15_000 });
	}
}

export { LoginPage };
