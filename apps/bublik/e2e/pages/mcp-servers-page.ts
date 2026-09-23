/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

class McpServersSettings {
	constructor(private readonly page: Page) {}

	get newServerButton(): Locator {
		return this.page.getByRole('button', { name: 'New server' });
	}

	get createDialog(): Locator {
		return this.page.getByRole('dialog', { name: 'New MCP server' });
	}

	get editDialog(): Locator {
		return this.page.getByRole('dialog', { name: 'Edit MCP server' });
	}

	get confirmDialog(): Locator {
		return this.page.getByRole('alertdialog');
	}

	/** The settings modal is URL-driven, so the tab is directly addressable. */
	async goto(): Promise<void> {
		await this.page.goto('dashboard?settings-open=1&settings-tab=mcp-servers');
		await expect(this.newServerButton).toBeVisible({ timeout: 30_000 });
	}

	async openCreateForm(): Promise<void> {
		await this.newServerButton.click();
		await expect(this.createDialog).toBeVisible({ timeout: 15_000 });
	}

	async closeCreateForm(): Promise<void> {
		await this.createDialog.getByRole('button', { name: 'Close' }).click();
		await expect(this.createDialog).toBeHidden({ timeout: 15_000 });
	}

	private async fillForm(
		dialog: Locator,
		{
			name,
			url,
			headers = []
		}: { name?: string; url?: string; headers?: [string, string][] }
	): Promise<void> {
		if (name !== undefined)
			await dialog.getByLabel('Name', { exact: true }).fill(name);
		if (url !== undefined) await dialog.getByLabel('URL').fill(url);
		for (const [headerName, value] of headers) {
			await dialog.getByRole('button', { name: 'Add header' }).click();
			await dialog.getByLabel('Header name').last().fill(headerName);
			await dialog.getByLabel('Value').last().fill(value);
		}
	}

	async submitCreateForm(input: {
		name: string;
		url: string;
		headers?: [string, string][];
	}): Promise<void> {
		await this.fillForm(this.createDialog, input);
		await this.createDialog.getByRole('button', { name: 'Add server' }).click();
	}

	async addServer(input: {
		name: string;
		url: string;
		headers?: [string, string][];
	}): Promise<void> {
		await this.openCreateForm();
		await this.submitCreateForm(input);
		await expect(this.createDialog).toBeHidden({ timeout: 15_000 });
		await expect(this.row(input.name)).toBeVisible({ timeout: 15_000 });
	}

	row(name: string): Locator {
		return this.page.getByRole('row').filter({ hasText: name });
	}

	headerChip(name: string, headerName: string): Locator {
		return this.row(name).getByText(headerName, { exact: true });
	}

	/** Opens the edit form, changes the name, and saves without touching values. */
	async rename(name: string, newName: string): Promise<void> {
		await this.row(name)
			.getByRole('button', { name: `Edit server ${name}` })
			.click();
		await expect(this.editDialog).toBeVisible({ timeout: 15_000 });
		await this.fillForm(this.editDialog, { name: newName });
		await this.editDialog.getByRole('button', { name: 'Save changes' }).click();
		await expect(this.editDialog).toBeHidden({ timeout: 15_000 });
	}

	async remove(name: string, confirm: boolean): Promise<void> {
		await this.row(name)
			.getByRole('button', { name: `Delete server ${name}` })
			.click();
		await expect(this.confirmDialog).toBeVisible({ timeout: 15_000 });
		await this.confirmDialog
			.getByRole('button', { name: confirm ? 'Delete' : 'Cancel' })
			.click();
		await expect(this.confirmDialog).toBeHidden({ timeout: 15_000 });
	}
}

export { McpServersSettings };
