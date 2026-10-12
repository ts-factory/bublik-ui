/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { QUERY_DELIMITER } from '../support/url-params';

/**
 * The URL parameters every classification table shares. Each page object
 * spreads these into its own `*_URL_PARAMS` table and adds the facets and
 * defaults that are its own — the codec is one, the defaults differ.
 *
 * Every write is `replaceIn`: a control changes its own key and leaves the
 * rest of the query alone, and a value equal to the table's default is
 * written as an absent key.
 */
interface ClassificationParamDefaults {
	/** What `pageSize` means when absent. */
	pageSize: number;
	/**
	 * What `sort` means when absent: the wire token (`created:desc`), or a
	 * description when the table keeps the server's order.
	 */
	sort: string;
	/** The localStorage key the column choices fall back to. */
	storageKey: string;
}

function classificationUrlParams(defaults: ClassificationParamDefaults) {
	return {
		page: {
			codec: 'raw, 1-based',
			values: 'a page number above one',
			whenAbsent: 'the first page — page one is never written',
			writtenBy:
				'the pagination control; forced back to 1 by every search, filter and page-size change, and clamped to the last page when the link asks for one past the end'
		},
		pageSize: {
			codec: 'raw',
			values: '10 | 25 | 50 | 75 | 100',
			whenAbsent: String(defaults.pageSize),
			writtenBy:
				'the Rows per page select; written as an absent key when it is the default again'
		},
		q: {
			codec: 'raw',
			values: 'free text, matched against the title, description and key',
			whenAbsent: 'no search is applied',
			writtenBy:
				'the search box, 300ms after typing stops; deleted when emptied'
		},
		sort: {
			codec: 'raw, `<column id>:asc|desc` or `none`',
			values: 'one column, one direction',
			whenAbsent: defaults.sort,
			writtenBy:
				'clicking a column header: ascending, then descending, then `none` — the default sort is written as an absent key'
		},
		cols: {
			codec: `raw, \`${QUERY_DELIMITER}\`-joined \`+id\` / \`-id\` overrides, sorted by id`,
			values: 'the columns the reader has shown or hidden against the default',
			whenAbsent: `localStorage \`bublik.columns.${defaults.storageKey}\`, then the default set`,
			writtenBy:
				'the Columns picker; the diff against the default, so returning a column to its default drops it from the key'
		},
		order: {
			codec: `raw, \`${QUERY_DELIMITER}\`-joined column ids, left to right`,
			values:
				'the whole order, pinned columns included; reconciled against the columns the table has',
			whenAbsent: `localStorage \`bublik.column-order.${defaults.storageKey}\`, then the default order`,
			writtenBy:
				'dragging a row in the Columns picker; the default order is written as an absent key'
		}
	} as const;
}

function facetParam(
	title: string,
	values: string,
	noun: string
): {
	codec: string;
	values: string;
	whenAbsent: string;
	writtenBy: string;
} {
	return {
		codec: `raw, \`${QUERY_DELIMITER}\`-joined`,
		values,
		whenAbsent: `${noun} are not narrowed by ${title.toLowerCase()}`,
		writtenBy: `the ${title} filter; deleted by Reset and when every value is unticked`
	};
}

interface ClassificationTableIds {
	table: string;
	/** The shared `Input` overrides `data-testid`, so the box is its placeholder. */
	searchPlaceholder: string;
	reset: string;
	row: string;
	/** The `data-*` attribute that carries a row's id. */
	rowIdAttribute: string;
}

const OPEN_TIMEOUT = 15_000;

/**
 * The controls shared by the issues, rules and run issues tables: the toolbar
 * (search, facets, Reset, Columns), the sortable headers and the footer
 * pagination. The page objects own the assertions that are theirs; this holds
 * the selectors that are the same on every page.
 */
class ClassificationTable {
	constructor(
		private readonly page: Page,
		private readonly ids: ClassificationTableIds
	) {}

	get root(): Locator {
		return this.page.getByTestId(this.ids.table);
	}

	/** Rows are `display: contents`, so a cell is what can be seen. */
	rows(): Locator {
		return this.page.getByTestId(this.ids.row);
	}

	row(id: number | string): Locator {
		return this.page.locator(
			`[data-testid="${this.ids.row}"][${this.ids.rowIdAttribute}="${id}"]`
		);
	}

	async expectLoaded(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
	}

	async expectRowListed(id: number | string): Promise<void> {
		await expect(this.row(id).locator('[role="cell"]').first()).toBeVisible({
			timeout: 30_000
		});
	}

	async expectRowAbsent(id: number | string): Promise<void> {
		await expect(this.row(id)).toHaveCount(0, { timeout: 15_000 });
	}

	async expectRowCountAtMost(count: number): Promise<void> {
		await expect
			.poll(() => this.rows().count(), { timeout: 30_000 })
			.toBeLessThanOrEqual(count);
	}

	async rowCount(): Promise<number> {
		await this.expectLoaded();
		return this.rows().count();
	}

	/** Every listed row carries `value` in `attribute`, and there is at least one. */
	async expectEveryRowAttribute(
		attribute: string,
		value: string,
		description: string
	): Promise<void> {
		await expect
			.poll(
				async () => {
					const values = await this.rows().evaluateAll(
						(rows, name) => rows.map((row) => row.getAttribute(name)),
						attribute
					);

					return values.length > 0 && values.every((entry) => entry === value);
				},
				{ timeout: 30_000, message: description }
			)
			.toBe(true);
	}

	get searchInput(): Locator {
		return this.page.getByPlaceholder(this.ids.searchPlaceholder, {
			exact: true
		});
	}

	async search(text: string): Promise<void> {
		await this.searchInput.fill(text);
	}

	facetTrigger(title: string): Locator {
		return this.page.getByRole('button', {
			name: new RegExp(`^${title}(\\s|$)`)
		});
	}

	/**
	 * Facet options are listed as `<label>` or `<label> (<count>)` in the
	 * popover the trigger opens; the label alone names them.
	 */
	facetOption(label: string): Locator {
		return this.page.getByRole('dialog').getByRole('option', {
			name: new RegExp(
				`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( \\(\\d+\\))?$`
			)
		});
	}

	async toggleFacetOption(title: string, label: string): Promise<void> {
		await this.facetTrigger(title).click();
		const option = this.facetOption(label);
		await expect(option).toBeVisible({ timeout: OPEN_TIMEOUT });
		await option.click();
		await this.page.keyboard.press('Escape');
		await expect(option).toBeHidden({ timeout: OPEN_TIMEOUT });
	}

	async expectFacetSelected(title: string, label: string): Promise<void> {
		await expect(this.facetTrigger(title)).toContainText(label, {
			timeout: 15_000
		});
	}

	columnHeader(label: string): Locator {
		return this.root.getByRole('columnheader', { name: label, exact: true });
	}

	async sortBy(label: string): Promise<void> {
		await this.columnHeader(label).getByText(label, { exact: true }).click();
	}

	/** The header the table is sorted by is highlighted; nothing else marks it. */
	async expectSortedBy(label: string): Promise<void> {
		await expect(this.columnHeader(label).locator('div').first()).toHaveClass(
			/bg-primary-wash/,
			{ timeout: 15_000 }
		);
	}

	headerLabels(): Promise<string[]> {
		return this.root
			.getByRole('columnheader')
			.evaluateAll((cells) =>
				cells.map((cell) => (cell.textContent ?? '').trim()).filter(Boolean)
			);
	}

	async expectHeaderShown(label: string): Promise<void> {
		await expect(this.columnHeader(label)).toBeVisible({ timeout: 15_000 });
	}

	async expectHeaderHidden(label: string): Promise<void> {
		await expect(this.columnHeader(label)).toHaveCount(0, { timeout: 15_000 });
	}

	get pagination(): Locator {
		return this.page.getByTestId('tw-pagination');
	}

	async setPageSize(pageSize: number): Promise<void> {
		await this.pagination
			.getByRole('combobox', { name: 'Rows per page' })
			.click();
		await this.page
			.getByRole('option', { name: String(pageSize), exact: true })
			.click();
	}

	async openNextPage(): Promise<void> {
		await this.pagination.getByRole('button', { name: 'Next page' }).click();
	}

	async openPreviousPage(): Promise<void> {
		await this.pagination
			.getByRole('button', { name: 'Previous page' })
			.click();
	}

	async expectOnLastPage(): Promise<void> {
		await expect(
			this.pagination.getByRole('button', { name: 'Next page' })
		).toBeDisabled({ timeout: 15_000 });
	}

	get columnsMenuTrigger(): Locator {
		return this.page.getByRole('button', { name: 'Columns', exact: true });
	}

	private async openColumnsMenu(): Promise<Locator> {
		const menu = this.page.getByRole('menu');

		await this.columnsMenuTrigger.click();
		await expect(menu).toBeVisible({ timeout: OPEN_TIMEOUT });

		return menu;
	}

	private async closeColumnsMenu(): Promise<void> {
		await this.page.keyboard.press('Escape');
		await expect(this.page.getByRole('menu')).toBeHidden({
			timeout: OPEN_TIMEOUT
		});
	}

	async toggleColumn(label: string): Promise<void> {
		const menu = await this.openColumnsMenu();

		await menu.getByText(label, { exact: true }).click();
		await this.closeColumnsMenu();
	}

	/**
	 * Drag `label`'s row in the Columns picker onto `targetLabel`'s row. The
	 * picker uses a pointer sensor with a 4px activation distance, so the
	 * pointer moves in steps rather than jumping.
	 */
	async moveColumnOnto(label: string, targetLabel: string): Promise<void> {
		const menu = await this.openColumnsMenu();
		const handle = menu
			.getByText(label, { exact: true })
			.locator(
				'xpath=ancestor::div[.//button[@aria-label="Reorder column"]][1]'
			)
			.getByRole('button', { name: 'Reorder column' });
		const target = menu.getByText(targetLabel, { exact: true });

		const from = await handle.boundingBox();
		const to = await target.boundingBox();
		if (!from || !to) {
			throw new Error(`Cannot drag "${label}" onto "${targetLabel}"`);
		}

		const startX = from.x + from.width / 2;
		const startY = from.y + from.height / 2;
		const endY = to.y + to.height / 2;

		await this.page.mouse.move(startX, startY);
		await this.page.mouse.down();
		for (let step = 1; step <= 10; step += 1) {
			await this.page.mouse.move(
				startX,
				startY + ((endY - startY) * step) / 10
			);
		}
		await this.page.mouse.up();
		await this.closeColumnsMenu();
	}

	get resetButton(): Locator {
		return this.page.getByTestId(this.ids.reset);
	}

	async reset(): Promise<void> {
		await this.resetButton.click();
	}

	groupHeaders(): Locator {
		return this.page.getByTestId('classification-group');
	}

	/**
	 * Each named project heads a group; with `exact`, no other project does.
	 * The seed plan does not own the instance, so the all-projects list may
	 * carry groups the plan never declared.
	 */
	async expectGroupedBy(
		projectNames: readonly string[],
		options: { exact?: boolean } = {}
	): Promise<void> {
		for (const name of projectNames) {
			await expect(this.groupHeaders().filter({ hasText: name })).toHaveCount(
				1,
				{ timeout: 30_000 }
			);
		}

		if (options.exact) {
			await expect(this.groupHeaders()).toHaveCount(projectNames.length);
		}
	}
}

export { ClassificationTable, classificationUrlParams, facetParam };
export type { ClassificationTableIds };
