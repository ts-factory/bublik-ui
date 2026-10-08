/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { Page } from '@playwright/test';

/**
 * Seed the user preferences the settings dialog stores in localStorage before
 * the page opens. Keys left out take the app's defaults.
 */
async function withUserPreferences(
	page: Page,
	preferences: Record<string, unknown>
): Promise<void> {
	await page.addInitScript((value) => {
		window.localStorage.setItem('user-preferences', JSON.stringify(value));
	}, preferences);
}

export { withUserPreferences };
