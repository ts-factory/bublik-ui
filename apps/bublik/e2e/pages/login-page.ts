/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Page } from '@playwright/test';

class LoginPage {
	constructor(private readonly page: Page) {}

	async signInAsAdmin(): Promise<void> {
		const email =
			process.env['BUBLIK_E2E_EMAIL'] ??
			process.env['DJANGO_SUPERUSER_EMAIL'] ??
			'admin@bublik.com';
		const password =
			process.env['BUBLIK_E2E_PASSWORD'] ??
			process.env['DJANGO_SUPERUSER_PASSWORD'] ??
			'admin';

		await this.page.goto('auth/login');
		await this.page.locator('input[name="email"]').fill(email);
		await this.page.locator('input[name="password"]').fill(password);
		await this.page.getByRole('button', { name: 'Sign in' }).click();
		await this.page.waitForURL('**/dashboard', { timeout: 15_000 });
	}
}

export { LoginPage };
