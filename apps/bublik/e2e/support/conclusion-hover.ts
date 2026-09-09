/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

const HOVER_CARD_OPEN_TIMEOUT = 5_000;

async function expectConclusionHoverCard(
	page: Page,
	indicator: Locator,
	conclusion: string
): Promise<void> {
	await expect(indicator).toHaveAttribute(
		'data-conclusion',
		`run-${conclusion}`,
		{ timeout: 30_000 }
	);

	const label = page.getByText('Conclusion:').first();

	await expect
		.poll(
			async () => {
				await page.mouse.move(0, 0);
				await indicator.hover({ timeout: 5_000 }).catch(() => undefined);

				return label
					.waitFor({ state: 'visible', timeout: HOVER_CARD_OPEN_TIMEOUT })
					.then(() => true)
					.catch(() => false);
			},
			{
				timeout: 30_000,
				intervals: [250],
				message: `expected the conclusion hover card of a "${conclusion}" run to open`
			}
		)
		.toBe(true);

	await expect(page.getByText(conclusion, { exact: true }).first()).toBeVisible(
		{
			timeout: 15_000
		}
	);
}

export { expectConclusionHoverCard };
