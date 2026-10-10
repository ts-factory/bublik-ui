/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { exactText } from '../support/e2e-data';
import { facetOptionName } from '../support/classification';

type ClassificationNoun = 'issue' | 'rule';

interface ClassificationTableOptions {
	noun: ClassificationNoun;
	/** The search box has no readable test id (`Input` overwrites it), so it goes by placeholder. */
	searchPlaceholder: string;
	resetTestId: string;
	tableTestId: string;
}

/**
 * The toolbar, grid and footer the issues, rules and run-issues tables share
 * (`libs/bublik/features/result-classification/src/lib/classification-table`).
 *
 * Rows and the stamps inside them are `display: contents`, so they have no box
 * of their own: assert on a row with `toHaveCount` or on one of its cells, never
 * `toBeVisible` on the row itself.
 */
class ClassificationTable {
	constructor(
		private readonly page: Page,
		private readonly root: Locator,
		private readonly options: ClassificationTableOptions
	) {}

	get table(): Locator {
		return this.root.getByTestId(this.options.tableTestId);
	}

	get searchInput(): Locator {
		return this.root.getByPlaceholder(this.options.searchPlaceholder);
	}

	get resetButton(): Locator {
		return this.root.getByTestId(this.options.resetTestId);
	}

	get columnsButton(): Locator {
		return this.root.getByRole('button', { name: 'Columns' });
	}

	get pagination(): Locator {
		return this.root.getByTestId('tw-pagination');
	}

	get rowsPerPage(): Locator {
		return this.pagination.getByRole('combobox', { name: 'Rows per page' });
	}

	/** "1–25 of 40 issues", "No rules", "1–3 of 3 matching · 10 total" … */
	get footerRange(): Locator {
		return this.root.getByText(
			new RegExp(
				`^(No ${this.options.noun}s|\\d+–\\d+ of \\d+ (${this.options.noun}s?|matching).*)$`
			)
		);
	}

	/** The faceted filter button titled `title`; its name grows with the selection. */
	facet(title: string): Locator {
		return this.root
			.getByRole('button', { name: new RegExp(`^${title}(\\s|$)`) })
			.first();
	}

	facetOption(label: string): Locator {
		return this.page.getByRole('option', { name: facetOptionName(label) });
	}

	group(projectId: number | string): Locator {
		return this.root.locator(
			`[data-testid="classification-group"][data-group-key="${projectId}"]`
		);
	}

	groupToggle(group: Locator): Locator {
		return group.getByTestId('classification-group-toggle');
	}

	/**
	 * The heading of the group `row` sits in. Headings are not wrappers: each is
	 * the sibling right before its rows, so the group is the nearest one above.
	 */
	groupOfRow(row: Locator): Locator {
		return row.locator(
			'xpath=preceding-sibling::*[@data-testid="classification-group"][1]'
		);
	}

	groupName(group: Locator): Locator {
		return group.getByTestId('project-group-name');
	}

	/** The heading's "N issues" / "N rules" count. */
	groupCount(group: Locator): Locator {
		return group.getByText(new RegExp(`^\\d+ ${this.options.noun}s?$`));
	}

	columnHeader(label: string): Locator {
		return this.table
			.getByRole('columnheader')
			.filter({ hasText: exactText(label) });
	}

	statusStripe(row: Locator): Locator {
		return row.getByTestId('status-stripe');
	}

	descriptionButton(row: Locator): Locator {
		return row.getByTestId('description-cell');
	}

	get descriptionPopover(): Locator {
		return this.page.getByTestId('description-popover');
	}

	get noMatching(): Locator {
		return this.root.getByText(`No matching ${this.options.noun}s`, {
			exact: true
		});
	}

	async search(text: string): Promise<void> {
		await this.searchInput.fill(text);
	}

	async clearSearch(): Promise<void> {
		await this.searchInput.fill('');
	}

	async toggleFacet(title: string, label: string): Promise<void> {
		await this.facet(title).click();
		const option = this.facetOption(label);
		await expect(option).toBeVisible({ timeout: 15_000 });
		await option.click();
		await this.page.keyboard.press('Escape');
		await expect(option).toBeHidden({ timeout: 15_000 });
	}

	async reset(): Promise<void> {
		await this.resetButton.click();
	}

	async toggleColumn(label: string): Promise<void> {
		await this.columnsButton.click();
		const menu = this.page.getByRole('menu');
		await expect(menu).toBeVisible({ timeout: 15_000 });
		await menu.getByText(label, { exact: true }).click();
		await this.page.keyboard.press('Escape');
		await expect(menu).toBeHidden({ timeout: 15_000 });
	}

	/**
	 * Drags column `columnId` onto `ontoColumnId` by its grip in the Columns
	 * menu, which moves it to that column's place.
	 */
	async dragColumn(columnId: string, ontoColumnId: string): Promise<void> {
		await this.columnsButton.click();
		const menu = this.page.getByRole('menu');
		await expect(menu).toBeVisible({ timeout: 15_000 });

		const grip = (id: string) =>
			menu
				.locator(
					`[data-testid="column-visibility-item"][data-column-id="${id}"]`
				)
				.getByRole('button', { name: 'Reorder column' });
		const from = await grip(columnId).boundingBox();
		const onto = await grip(ontoColumnId).boundingBox();
		if (!from || !onto) throw new Error('the Columns menu grips have no box');

		const centre = (box: NonNullable<typeof from>) =>
			[box.x + box.width / 2, box.y + box.height / 2] as const;
		await this.page.mouse.move(...centre(from));
		await this.page.mouse.down();
		// dnd-kit starts a drag only after the pointer has moved a few pixels.
		await this.page.mouse.move(centre(from)[0], centre(from)[1] + 8, {
			steps: 4
		});
		await this.page.mouse.move(...centre(onto), { steps: 12 });
		await this.page.mouse.up();

		await this.page.keyboard.press('Escape');
		await expect(menu).toBeHidden({ timeout: 15_000 });
	}

	async expectColumnLeftOf(label: string, otherLabel: string): Promise<void> {
		await expect(async () => {
			const left = await this.columnHeader(label).boundingBox();
			const right = await this.columnHeader(otherLabel).boundingBox();
			expect(
				left && right && left.x < right.x,
				`${label} left of ${otherLabel}`
			).toBe(true);
		}).toPass({ timeout: 15_000 });
	}

	async setRowsPerPage(size: 10 | 25 | 50 | 75 | 100): Promise<void> {
		await this.rowsPerPage.click();
		await this.page
			.getByRole('option', { name: String(size), exact: true })
			.click();
	}

	async sortBy(label: string): Promise<void> {
		await this.columnHeader(label).getByText(label, { exact: true }).click();
	}

	async collapseGroup(projectId: number | string): Promise<void> {
		const group = this.group(projectId);
		await expect(group).toHaveAttribute('data-expanded', 'true');
		await this.groupToggle(group).click();
		await expect(group).toHaveAttribute('data-expanded', 'false');
	}

	async expandGroup(projectId: number | string): Promise<void> {
		const group = this.group(projectId);
		await this.groupToggle(group).click();
		await expect(group).toHaveAttribute('data-expanded', 'true');
	}

	async openDescription(row: Locator): Promise<void> {
		await this.descriptionButton(row).click();
		await expect(this.descriptionPopover).toBeVisible({ timeout: 15_000 });
	}

	async expectReady(): Promise<void> {
		await expect(this.table.or(this.noMatching)).toBeVisible({
			timeout: 30_000
		});
	}

	async expectRowListed(row: Locator): Promise<void> {
		await expect(row).toHaveCount(1, { timeout: 30_000 });
		await expect(row.getByRole('cell').first()).toBeVisible({
			timeout: 15_000
		});
	}

	async expectRowGone(row: Locator): Promise<void> {
		await expect(row).toHaveCount(0, { timeout: 30_000 });
	}

	async expectNoMatching(): Promise<void> {
		await expect(this.noMatching).toBeVisible({ timeout: 30_000 });
	}

	async expectFooterRange(): Promise<void> {
		await expect(this.footerRange).toBeVisible({ timeout: 30_000 });
	}

	async expectResetDisabled(): Promise<void> {
		await expect(this.resetButton).toBeDisabled({ timeout: 15_000 });
	}

	async expectResetEnabled(): Promise<void> {
		await expect(this.resetButton).toBeEnabled({ timeout: 15_000 });
	}

	async expectColumnShown(label: string): Promise<void> {
		await expect(this.columnHeader(label)).toBeVisible({ timeout: 15_000 });
	}

	async expectColumnHidden(label: string): Promise<void> {
		await expect(this.columnHeader(label)).toHaveCount(0, { timeout: 15_000 });
	}

	async expectFacetReports(title: string, label: string): Promise<void> {
		await expect(this.facet(title)).toContainText(label, { timeout: 15_000 });
	}

	async expectRowInGroup(
		row: Locator,
		projectId: number | string
	): Promise<void> {
		await this.expectRowListed(row);
		await expect(this.groupOfRow(row)).toHaveAttribute(
			'data-group-key',
			String(projectId),
			{ timeout: 15_000 }
		);
	}

	/**
	 * The group's heading names `name` and counts at least `atLeast` rows: other
	 * scenarios may add rows to the same project at any time.
	 */
	async expectGroupHeading(
		projectId: number | string,
		{ name, atLeast }: { name: string; atLeast: number }
	): Promise<void> {
		const group = this.group(projectId);

		await expect(this.groupName(group)).toHaveText(name, { timeout: 15_000 });
		await expect(async () => {
			const text = (await this.groupCount(group).textContent()) ?? '';
			expect(Number.parseInt(text, 10)).toBeGreaterThanOrEqual(atLeast);
		}).toPass({ timeout: 15_000 });
	}

	async expectGroupExpanded(
		projectId: number | string,
		expanded: boolean
	): Promise<void> {
		await expect(this.group(projectId)).toHaveAttribute(
			'data-expanded',
			String(expanded),
			{ timeout: 15_000 }
		);
	}
}

export { ClassificationTable };
export type { ClassificationNoun, ClassificationTableOptions };
