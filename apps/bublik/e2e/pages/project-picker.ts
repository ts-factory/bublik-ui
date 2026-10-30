/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

class ProjectPicker {
	constructor(private readonly page: Page) {}

	private sidebar(): Locator {
		return this.page.locator('#sidebar');
	}

	trigger(): Locator {
		return this.sidebar().getByTestId('project-picker-trigger');
	}

	/** The popover is portalled out of the sidebar and unmounted when closed. */
	list(): Locator {
		return this.page.getByTestId('project-picker-list');
	}

	option(projectId: number | 'all'): Locator {
		return this.list().locator(
			`[data-testid="project-picker-option"][data-project-id="${projectId}"]`
		);
	}

	private searchInput(): Locator {
		return this.list().getByRole('combobox', { name: 'Find project' });
	}

	private actions(): Locator {
		return this.list().getByTestId('project-picker-actions');
	}

	/** The switcher renders, and takes P, once the projects have loaded. */
	async expectReady(): Promise<void> {
		await expect(this.trigger()).toBeVisible({ timeout: 15_000 });
	}

	async open(): Promise<void> {
		if (await this.list().isVisible()) return;

		await this.trigger().click();
		await this.expectOpen();
	}

	async openWithHotkey(): Promise<void> {
		await this.page.locator('body').press('p');
	}

	async select(projectId: number): Promise<void> {
		await this.open();
		await this.option(projectId).click();
		await expect(this.page).toHaveURL(new RegExp(`project=${projectId}`), {
			timeout: 15_000
		});
	}

	async selectAll(): Promise<void> {
		await this.open();
		await this.option('all').click();
		await expect
			.poll(() => new URL(this.page.url()).searchParams.get('project'), {
				timeout: 15_000
			})
			.toBeNull();
	}

	async search(text: string): Promise<void> {
		await this.open();
		await this.searchInput().fill(text);
	}

	async manage(): Promise<void> {
		await this.open();
		await this.actions().getByRole('link', { name: 'Manage' }).click();
	}

	async expectSelectedLabel(name: string): Promise<void> {
		await expect(this.trigger()).toContainText(name, { timeout: 15_000 });
	}

	async expectOpen(): Promise<void> {
		await expect(this.list()).toBeVisible({ timeout: 15_000 });
		await expect(this.searchInput()).toBeFocused();
	}

	async expectClosed(): Promise<void> {
		await expect(this.list()).toBeHidden();
	}

	async expectListed(projectId: number): Promise<void> {
		await expect(this.option(projectId)).toBeVisible();
	}

	async expectNotListed(projectId: number): Promise<void> {
		await expect(this.option(projectId)).toBeHidden();
	}

	async expectNoMatch(text: string): Promise<void> {
		await expect(this.list()).toContainText(`No project matches “${text}”`);
		await expect(
			this.list().locator('[data-testid="project-picker-option"]')
		).toHaveCount(0);
	}

	async expectActions(): Promise<void> {
		await expect(
			this.actions().getByRole('button', { name: 'New Project' })
		).toBeVisible();
		await expect(
			this.actions().getByRole('link', { name: 'Manage' })
		).toBeVisible();
	}

	async expectNoActions(): Promise<void> {
		await expect(this.actions()).toHaveCount(0);
	}
}

export { ProjectPicker };
