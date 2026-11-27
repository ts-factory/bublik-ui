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

	private orderButton(): Locator {
		return this.list().getByTestId('project-picker-order');
	}

	/** Shown while the pointer is over its row, in the check mark's place. */
	private dragHandle(projectId: number): Locator {
		return this.option(projectId).getByTestId('project-picker-drag-handle');
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

	/**
	 * Picking closes the popover with an exit animation. `open()` takes a list
	 * that is still closing for an open one, so wait it out before returning.
	 */
	async select(projectId: number): Promise<void> {
		await this.open();
		await this.option(projectId).click();
		await this.expectClosed();
		await expect(this.page).toHaveURL(new RegExp(`project=${projectId}`), {
			timeout: 15_000
		});
	}

	async selectAll(): Promise<void> {
		await this.open();
		await this.option('all').click();
		await this.expectClosed();
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

	/** `label` is an entry of the order menu, e.g. "Newest First". */
	async orderBy(label: string): Promise<void> {
		await this.open();
		await this.orderButton().click();
		// The menu is portalled out of the popover, like the popover itself
		await this.page
			.getByTestId('project-picker-order-menu')
			.getByRole('menuitemradio', { name: label, exact: true })
			.click();
	}

	/**
	 * Drops a project on another one's row: it lands before a row above it and
	 * after a row below it. Moved in steps, as a drag only starts once the
	 * pointer has travelled and only follows the moves it is sent.
	 */
	async dragOnto(projectId: number, targetProjectId: number): Promise<void> {
		await this.open();
		await this.option(projectId).hover();

		const handle = await this.dragHandle(projectId).boundingBox();
		const target = await this.option(targetProjectId).boundingBox();

		if (!handle || !target) {
			throw new Error('The project rows to drag between are not laid out.');
		}

		const x = handle.x + handle.width / 2;
		const fromY = handle.y + handle.height / 2;
		const toY = target.y + target.height / 2;

		await this.page.mouse.move(x, fromY);
		await this.page.mouse.down();
		await this.page.mouse.move(x, fromY + Math.sign(toY - fromY) * 10, {
			steps: 4
		});
		await this.page.mouse.move(x, toY, { steps: 12 });
		await this.page.mouse.up();
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

	/** The projects from the top down; the all-projects row is not one. */
	async expectProjectOrder(projectIds: number[]): Promise<void> {
		await expect
			.poll(() =>
				this.list()
					.locator(
						'[data-testid="project-picker-option"]:not([data-project-id="all"])'
					)
					.evaluateAll((rows) =>
						rows.map((row) => Number((row as HTMLElement).dataset['projectId']))
					)
			)
			.toEqual(projectIds);
	}

	async expectOrderLabel(label: string): Promise<void> {
		await expect(this.orderButton()).toHaveText(label);
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
