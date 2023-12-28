/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
	await page.goto('runs');

	// Expect h1 to contain a substring.
	expect(await page.locator('h1').innerText()).toContain('Welcome');
});
