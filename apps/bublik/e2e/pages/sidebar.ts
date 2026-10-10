/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

const HOVER_CARD_OPEN_TIMEOUT = 5_000;
const RELEASE_TAG = /^v\d+\.\d+\.\d+/;

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

	/**
	 * Expands the sidebar when it is collapsed. The toggle's `data-state` is
	 * its tooltip's, not the sidebar's; the submenu toggles only render while
	 * the sidebar is expanded, so their presence is what says it is.
	 */
	private async openSidebar(): Promise<void> {
		const submenuToggles = this.page
			.getByRole('navigation')
			.getByRole('button', { name: 'Toggle submenu' });

		if ((await submenuToggles.count()) > 0) return;

		await this.sidebarToggle().click();
		await expect(submenuToggles.first()).toBeVisible({ timeout: 15_000 });
	}

	/** The main Issues item; the submenu repeats the name, so take the first. */
	private issuesLink(): Locator {
		return this.page
			.getByRole('navigation')
			.getByRole('link', { name: 'Issues', exact: true })
			.first();
	}

	private issuesToggle(): Locator {
		return this.issuesLink()
			.locator(
				'xpath=ancestor::div[.//button[@aria-label="Toggle submenu"]][1]'
			)
			.getByRole('button', { name: 'Toggle submenu' });
	}

	/** Follows the main Issues item, in-app, so the compressed sidebar state travels. */
	async openIssuesList(): Promise<void> {
		await this.openSidebar();
		await this.issuesLink().click();
		await expect(this.page).toHaveURL(/\/issues(?:$|\?)/, { timeout: 15_000 });
	}

	/**
	 * Follows one of the Issues submenu's items. The submenu is already open on
	 * most pages; the toggle is only clicked when the item is not showing.
	 */
	async openIssuesSubmenu(item: 'Issues' | 'Rules'): Promise<void> {
		await this.openSidebar();

		const links = this.page
			.getByRole('navigation')
			.getByRole('link', { name: item, exact: true });
		const link = item === 'Issues' ? links.last() : links.first();
		// A folded submenu clips its list to zero height. The item keeps its
		// own box, so it still reads as visible; the fold shows on the list's
		// grid container, which carries `grid-rows-[1fr]` only while open.
		const fold = link.locator(
			'xpath=ancestor::div[contains(@class,"grid-rows-")][1]'
		);
		const isUnfolded = async () =>
			((await fold.getAttribute('class')) ?? '').includes('grid-rows-[1fr]');

		if (!(await isUnfolded())) {
			await this.issuesToggle().click();
		}

		await expect.poll(isUnfolded, { timeout: 15_000 }).toBe(true);
		await expect(link).toBeVisible({ timeout: 15_000 });
		await link.click();
		await expect(this.page).toHaveURL(
			item === 'Issues' ? /\/issues(?:$|\?)/ : /\/issues\/rules/,
			{ timeout: 15_000 }
		);
	}

	/** Follows the Dashboard item, in-app, so the compressed sidebar state travels. */
	async openDashboard(): Promise<void> {
		await this.page
			.getByRole('navigation')
			.getByRole('link', { name: 'Dashboard', exact: true })
			.click();
		await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
	}

	/** The Issue item: a link once an issue page was visited, a plain label before. */
	issueLink(): Locator {
		return this.page
			.getByRole('navigation')
			.getByRole('link', { name: 'Issue', exact: true });
	}

	async expectIssueLinkDisabled(): Promise<void> {
		await expect(this.issuesLink()).toBeVisible({ timeout: 30_000 });
		await expect(this.issueLink()).toHaveCount(0);
	}

	async expectIssueLinkTo(issueId: number): Promise<void> {
		await expect(this.issueLink()).toHaveAttribute(
			'href',
			new RegExp(`/issues/${issueId}(?:$|\\?)`),
			{ timeout: 15_000 }
		);
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

	/**
	 * Only a build sitting exactly on a release tag has release notes to link
	 * to. The e2e stack builds the checked-out tree, which `git_version_env.sh`
	 * labels `dev` unless HEAD is a tag, so the expectation follows the label.
	 */
	async expectVersionLinksToReleaseNotes(): Promise<void> {
		const label = this.versionLabel();
		const version = (await label.textContent())?.trim() ?? '';

		if (RELEASE_TAG.test(version)) {
			await expect(label).toHaveAttribute(
				'href',
				new RegExp(`/docs/blog/release-${version.replace(/\./g, '\\.')}$`)
			);
			await expect(label).toHaveAttribute('target', '_blank');
		} else {
			await expect(label).not.toHaveAttribute('href');
		}
	}
}

export { Sidebar };
