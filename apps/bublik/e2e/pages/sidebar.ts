/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

const HOVER_CARD_OPEN_TIMEOUT = 5_000;

class Sidebar {
	constructor(private readonly page: Page) {}

	versionLabel(): Locator {
		return this.page.getByTestId('sidebar-version');
	}

	/**
	 * The deploy info lives in a hover card, and its content renders a pulse
	 * placeholder until the server version query settles, so a single hover can
	 * land before there is anything to read. Re-hover until the card opens, the
	 * way `support/conclusion-hover.ts` does for the run conclusion card.
	 */
	async expectDeployInfoOnHover(): Promise<void> {
		const uiVersion = this.page.getByText(/^UI:/).first();

		await expect
			.poll(
				async () => {
					await this.page.mouse.move(0, 0);
					await this.versionLabel()
						.hover({ timeout: 5_000 })
						.catch(() => undefined);

					return uiVersion
						.waitFor({ state: 'visible', timeout: HOVER_CARD_OPEN_TIMEOUT })
						.then(() => true)
						.catch(() => false);
				},
				{
					timeout: 30_000,
					intervals: [250],
					message: 'expected the deploy info hover card to open'
				}
			)
			.toBe(true);

		await expect(this.page.getByText(/^API:/).first()).toBeVisible({
			timeout: 15_000
		});
	}
}

export { Sidebar };
