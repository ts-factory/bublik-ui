/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { Page } from '@playwright/test';

async function pressMod(page: Page, key: string): Promise<void> {
	const isMac = await page.evaluate(() => {
		const platform = navigator.platform?.toLowerCase() ?? '';
		const userAgent = navigator.userAgent?.toLowerCase() ?? '';

		return platform.includes('mac') || userAgent.includes('mac');
	});

	await page.keyboard.press(`${isMac ? 'Meta' : 'Control'}+${key}`);
}

export { pressMod };
