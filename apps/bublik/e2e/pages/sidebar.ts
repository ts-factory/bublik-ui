/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

const HOVER_CARD_OPEN_TIMEOUT = 5_000;

class Sidebar {
	constructor(private readonly page: Page) {}

	versionLabel(): Locator {
		return this.page.getByTestId('sidebar-version');
	}

	/** The last footer item when signed in; its accessible name is "<name> · Account menu" */
	accountRow(): Locator {
		return this.page.getByRole('button', { name: /· Account menu$/ });
	}

	/** The last footer item when signed out, in place of the account row */
	signInButton(): Locator {
		return this.page
			.getByRole('navigation')
			.getByRole('button', { name: 'Sign In', exact: true });
	}

	accountMenuItem(name: string): Locator {
		return this.page.getByRole('menuitem', { name, exact: true });
	}

	async openAccountMenu(): Promise<void> {
		await this.accountRow().click();
		await expect(this.page.getByRole('menu')).toBeVisible({ timeout: 15_000 });
	}

	async closeAccountMenu(): Promise<void> {
		await this.page.keyboard.press('Escape');
		await expect(this.page.getByRole('menu')).toHaveCount(0);
	}

	private sidebarToggle(): Locator {
		return this.page.getByRole('button', {
			name: 'Toggle sidebar open state'
		});
	}

	private adminToggle(): Locator {
		return this.page
			.getByRole('link', { name: 'Admin', exact: true })
			.locator(
				'xpath=ancestor::div[.//button[@aria-label="Toggle submenu"]][1]'
			)
			.getByRole('button', { name: 'Toggle submenu' });
	}

	async openAdminUsers(): Promise<void> {
		const sidebarToggle = this.sidebarToggle();
		if ((await sidebarToggle.getAttribute('data-state')) === 'closed') {
			await sidebarToggle.click();
		}

		await this.adminToggle().click();
		const usersLink = this.page.getByRole('link', {
			name: 'Users',
			exact: true
		});
		await expect(usersLink).toBeVisible({ timeout: 15_000 });
		await usersLink.click();
		await expect(this.page).toHaveURL(/\/admin\/users/);
	}

	settingsDialog(): Locator {
		return this.page.getByRole('dialog', { name: 'Settings' });
	}

	async expectSignedIn(): Promise<void> {
		await expect(this.accountRow()).toBeVisible({ timeout: 30_000 });
		await expect(this.accountRow()).not.toHaveAccessibleName(/^Guest/);
		await this.openAccountMenu();
		await expect(this.accountMenuItem('Sign Out')).toBeVisible();
		await this.closeAccountMenu();
	}

	async expectSignedOut(): Promise<void> {
		await expect(this.signInButton()).toBeVisible({ timeout: 30_000 });
		await expect(this.accountRow()).toHaveCount(0);
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
