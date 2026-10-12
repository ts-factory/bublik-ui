/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

/**
 * `/auth/register/activate/:userId/:token/` — the page a registration email
 * links to. It verifies the token the moment it mounts; the trailing slash is
 * part of the address the emails carry.
 */
class EmailActivationPage {
	constructor(private readonly page: Page) {}

	async goto(userId: string, token: string): Promise<void> {
		await this.page.goto(`auth/register/activate/${userId}/${token}/`);
		await expect(this.page).toHaveURL(
			new RegExp(`/auth/register/activate/${userId}/${token}/$`)
		);
	}

	get heading(): Locator {
		return this.page.getByRole('heading', {
			name: 'Email verification in progress...'
		});
	}

	async expectVerifying(): Promise<void> {
		await expect(this.heading).toBeVisible({ timeout: 30_000 });
	}

	async expectRejected(): Promise<void> {
		await expect(
			this.page.getByText('Failed to verify email!').first()
		).toBeVisible({ timeout: 30_000 });
	}
}

export { EmailActivationPage };
