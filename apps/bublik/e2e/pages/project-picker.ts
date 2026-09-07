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

	list(): Locator {
		return this.sidebar().getByTestId('project-picker-list');
	}

	option(projectId: number | 'all'): Locator {
		return this.sidebar().locator(
			`[data-testid="project-picker-option"][data-project-id="${projectId}"]`
		);
	}

	async open(): Promise<void> {
		if ((await this.list().getAttribute('data-state')) === 'open') return;

		await this.trigger().click();
		await expect(this.list()).toHaveAttribute('data-state', 'open', {
			timeout: 15_000
		});
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

	async expectSelectedLabel(name: string): Promise<void> {
		await expect(this.trigger()).toContainText(name, { timeout: 15_000 });
	}
}

export { ProjectPicker };
