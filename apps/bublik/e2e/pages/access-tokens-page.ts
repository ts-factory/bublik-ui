/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

/** The value is shown once, so it is captured as the dialog renders it. */
const TOKEN_VALUE_PATTERN = /bpat_[A-Za-z0-9_-]{20,}/;

class AccessTokensSettings {
	constructor(private readonly page: Page) {}

	get newTokenButton(): Locator {
		return this.page.getByRole('button', { name: 'New token' });
	}

	get createDialog(): Locator {
		return this.page.getByRole('dialog', { name: 'New access token' });
	}

	get revealDialog(): Locator {
		return this.page.getByRole('dialog', { name: 'Your new access token' });
	}

	get confirmDialog(): Locator {
		return this.page.getByRole('alertdialog');
	}

	/** The settings modal is URL-driven, so the tab is directly addressable. */
	async goto(): Promise<void> {
		await this.page.goto('dashboard?settings-open=1&settings-tab=tokens');
		await expect(this.newTokenButton).toBeVisible({ timeout: 30_000 });
	}

	async openCreateForm(): Promise<void> {
		await this.newTokenButton.click();
		await expect(this.createDialog).toBeVisible({ timeout: 15_000 });
	}

	async submitCreateForm(name: string, expiry = 'Never'): Promise<void> {
		if (name) await this.createDialog.getByLabel('Name').fill(name);
		await this.createDialog.getByRole('button', { name: expiry }).click();
		await this.createDialog
			.getByRole('button', { name: 'Create token' })
			.click();
	}

	async closeCreateForm(): Promise<void> {
		await this.createDialog.getByRole('button', { name: 'Close' }).click();
		await expect(this.createDialog).toBeHidden({ timeout: 15_000 });
	}

	/** Creates a token and returns its value, read from the reveal dialog. */
	async createToken(name: string): Promise<string> {
		await this.openCreateForm();
		await this.submitCreateForm(name);
		await expect(this.revealDialog).toBeVisible({ timeout: 15_000 });

		const shown = await this.revealDialog.innerText();
		const match = shown.match(TOKEN_VALUE_PATTERN);
		expect(match, 'the reveal dialog shows a bpat_ token').not.toBeNull();

		return match?.[0] ?? '';
	}

	async dismissRevealDialog(): Promise<void> {
		await this.revealDialog
			.getByRole('button', { name: "I've saved it" })
			.click();
		await expect(this.revealDialog).toBeHidden({ timeout: 15_000 });
	}

	row(name: string): Locator {
		return this.page.getByRole('row').filter({ hasText: name });
	}

	async revoke(name: string, confirm: boolean): Promise<void> {
		await this.row(name)
			.getByRole('button', { name: /Revoke/ })
			.click();
		await expect(this.confirmDialog).toBeVisible({ timeout: 15_000 });
		await this.confirmDialog
			.getByRole('button', { name: confirm ? 'Revoke' : 'Cancel' })
			.click();
		await expect(this.confirmDialog).toBeHidden({ timeout: 15_000 });
	}

	async expectStatus(name: string, status: string): Promise<void> {
		await expect(this.row(name).getByText(status, { exact: true })).toBeVisible(
			{ timeout: 15_000 }
		);
	}
}

export { AccessTokensSettings, TOKEN_VALUE_PATTERN };
