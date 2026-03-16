/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { HistoryGlobalSearchForm } from './history-global-search-form';

class HistoryPage {
	readonly page: Page;
	readonly editSearchButton: Locator;
	readonly globalSearchForm: HistoryGlobalSearchForm;

	constructor(page: Page) {
		this.page = page;
		this.editSearchButton = page.getByRole('button', { name: 'Edit Search' });
		this.globalSearchForm = new HistoryGlobalSearchForm(page);
	}

	async goto(searchParams?: URLSearchParams | string): Promise<void> {
		const search =
			typeof searchParams === 'string'
				? searchParams
				: searchParams?.toString() ?? '';
		const url = search.length > 0 ? `history?${search}` : 'history';

		await this.page.goto(url);
		await expect(this.page).toHaveURL(/\/history(?:$|\?)/);
	}

	async expectReady(): Promise<void> {
		await expect(this.editSearchButton).toBeVisible();
	}

	async openGlobalSearchForm(): Promise<void> {
		await this.editSearchButton.click();
		await this.globalSearchForm.expectVisible();
	}
}

export { HistoryPage };
