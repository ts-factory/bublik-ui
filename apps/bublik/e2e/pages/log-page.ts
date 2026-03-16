/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

class LogPage {
	constructor(private readonly page: Page) {}

	get root(): Locator {
		return this.page.getByTestId('log-page');
	}

	get tree(): Locator {
		return this.page.getByTestId('log-tree');
	}

	get logTable(): Locator {
		return this.page.getByTestId('log-table-block').first();
	}

	get legacyToggle(): Locator {
		return this.page.getByTestId('log-legacy-toggle');
	}

	get legacyFrame(): Locator {
		return this.page.frameLocator('iframe[title="log"]').locator('body');
	}

	async goto(
		runId: number,
		searchParams?: URLSearchParams | string
	): Promise<void> {
		const search =
			typeof searchParams === 'string'
				? searchParams
				: searchParams?.toString() ?? '';
		await this.page.goto(`log/${runId}${search ? `?${search}` : ''}`);
		await expect(this.page).toHaveURL(new RegExp(`/log/${runId}`));
	}

	async expectLoaded(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
		await expect(
			this.root.getByRole('main').getByText('Log', { exact: true })
		).toBeVisible({ timeout: 30_000 });
	}

	async expectInfoVisible(): Promise<void> {
		await expect(this.page.getByTestId('log-info')).toBeVisible({
			timeout: 30_000
		});
	}

	async expectInfoHidden(): Promise<void> {
		await expect(this.page.getByTestId('log-info')).toHaveCount(0);
	}

	async expectTreeVisible(): Promise<void> {
		await expect(this.tree).toBeVisible({ timeout: 30_000 });
	}

	async expectTreeHidden(): Promise<void> {
		await expect(this.tree).toHaveCount(0);
	}

	treeItem(resultId: string | number): Locator {
		return this.page.locator(
			`[data-testid="log-tree-item"][data-log-tree-item-id="${resultId}"]`
		);
	}

	async expectFocusedTreeItem(resultId: string | number): Promise<void> {
		await expect(this.treeItem(resultId)).toHaveAttribute(
			'data-log-tree-item-focused',
			'true',
			{ timeout: 30_000 }
		);
	}

	async showRunLog(): Promise<void> {
		await this.page.getByTestId('log-tree-run-log').click();
		await expect(this.page).not.toHaveURL(/focusId=/, { timeout: 15_000 });
	}

	async toggleOnlyNok(): Promise<void> {
		await this.page.getByTestId('log-tree-only-nok').click();
	}

	async scrollToFocus(): Promise<void> {
		await this.page.getByTestId('log-tree-scroll-to-focus').click();
	}

	async toggleLegacyLog(): Promise<void> {
		await this.legacyToggle.click();
	}

	async openFocusedResultMeasurements(): Promise<void> {
		await this.root.getByRole('link', { name: 'Result', exact: true }).click();
	}

	async expectJsonLogVisible(): Promise<void> {
		await expect(this.logTable).toBeVisible({ timeout: 30_000 });
	}

	async expectLegacyLogVisible(): Promise<void> {
		await expect(this.page.locator('iframe[title="log"]')).toBeVisible({
			timeout: 30_000
		});
	}

	async bookmarkFirstLine(): Promise<string> {
		const firstLine = this.page.getByTestId('log-line-number').first();
		await expect(firstLine).toBeVisible({ timeout: 30_000 });
		const line = await firstLine.getAttribute('data-log-line-number');
		await firstLine.click();
		await expect(this.page).toHaveURL(/lineNumber=/, { timeout: 15_000 });
		return line ?? '1';
	}

	async expandFirstRowIfAvailable(): Promise<void> {
		const expandButton = this.page.getByTestId('log-row-expand').first();
		if (await expandButton.isVisible()) {
			await expandButton.click();
		}
	}

	async clickAllPagesIfAvailable(): Promise<void> {
		const button = this.page.getByTestId('log-all-pages').first();
		if (await button.isVisible()) {
			await button.click();
			await expect(this.page).toHaveURL(/page=0/, { timeout: 15_000 });
		}
	}
}

export { LogPage };
