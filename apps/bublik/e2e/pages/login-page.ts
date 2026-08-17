/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

/**
 * The credentials the stack was bootstrapped with. CI exports
 * BUBLIK_E2E_EMAIL/PASSWORD; locally they fall back to the Django superuser
 * env, then to the defaults from bublik-docker's .env.example.
 */
function adminEmail(): string {
	return (
		process.env['BUBLIK_E2E_EMAIL'] ??
		process.env['DJANGO_SUPERUSER_EMAIL'] ??
		'admin@bublik.com'
	);
}

function adminPassword(): string {
	return (
		process.env['BUBLIK_E2E_PASSWORD'] ??
		process.env['DJANGO_SUPERUSER_PASSWORD'] ??
		'admin'
	);
}

class LoginPage {
	constructor(private readonly page: Page) {}

	get emailInput(): Locator {
		return this.page.locator('input[name="email"]');
	}

	get passwordInput(): Locator {
		return this.page.locator('input[name="password"]');
	}

	get submitButton(): Locator {
		return this.page.getByRole('button', { name: 'Sign in' });
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

export { adminEmail, adminPassword, LoginPage };
