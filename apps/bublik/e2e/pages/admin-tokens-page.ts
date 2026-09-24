/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

class AdminTokensPage {
	constructor(private readonly page: Page) {}

	get heading(): Locator {
		return this.page.getByRole('heading', { name: 'Access tokens' });
	}

	get table(): Locator {
		return this.page.getByRole('table');
	}

	async goto(): Promise<void> {
		await this.page.goto('admin/tokens');
		await expect(this.heading).toBeVisible({ timeout: 30_000 });
	}

	async expectOwnerColumn(): Promise<void> {
		await expect(
			this.table.getByRole('columnheader', { name: 'Owner' })
		).toBeVisible({ timeout: 15_000 });
	}

	async tableText(): Promise<string> {
		return this.table.innerText();
	}
}

export { AdminTokensPage };
