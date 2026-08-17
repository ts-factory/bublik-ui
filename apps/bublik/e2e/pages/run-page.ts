/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

class RunPage {
	constructor(private readonly page: Page) {}

	async goto(runId: number): Promise<void> {
		await this.page.goto(`runs/${runId}`);
		await expect(this.page).toHaveURL(new RegExp(`/runs/${runId}`));
	}

	async expectLoaded(name: string): Promise<void> {
		await expect(this.page.getByTestId('run-table')).toBeVisible({
			timeout: 30_000
		});
		await expect(
			this.page.getByText(name, { exact: false }).first()
		).toBeVisible({ timeout: 30_000 });
	}

	rows(): Locator {
		return this.page.getByTestId('run-row');
	}

	/** Package (or session/suite) rows of the run tree, by their expanded state. */
	packageRows(options: { expanded?: boolean } = {}): Locator {
		const expanded =
			options.expanded === undefined
				? ''
				: `[data-expanded="${options.expanded}"]`;

		return this.page.locator(
			`[data-testid="run-row"]:not([data-node-type="test"])${expanded}`
		);
	}

	/** Result tables are only in the DOM while their test row is expanded. */
	resultTables(): Locator {
		return this.page.getByTestId('run-result-table');
	}

	async expectExpandedPackage(): Promise<void> {
		await expect(this.packageRows({ expanded: true }).first()).toBeVisible({
			timeout: 30_000
		});
	}

	async expectResultTableVisible(): Promise<void> {
		await expect(this.resultTables().first()).toBeVisible({ timeout: 30_000 });
	}

	async expectNoResultTable(): Promise<void> {
		await expect(this.resultTables()).toHaveCount(0);
	}

	/**
	 * Scoped to the toolbar because the requirements filter and every expanded
	 * result table carry a Reset button of their own.
	 */
	get toolbar(): Locator {
		return this.page.getByTestId('run-table-toolbar');
	}

	async previewNok(): Promise<void> {
		await this.toolbar.getByRole('button', { name: 'Preview NOK' }).click();
	}

	async openNok(): Promise<void> {
		await this.toolbar.getByRole('button', { name: 'Open NOK' }).click();
	}

	async resetTable(): Promise<void> {
		await this.toolbar
			.getByRole('button', { name: 'Reset', exact: true })
			.click();
	}

	/** A `<dd>` of the info card, addressed by the label of its `<dt>`. */
	detail(label: string): Locator {
		return this.page.locator(
			`[data-testid="run-detail"][data-label="${label}"]`
		);
	}

	async expectDetail(label: string, value?: string): Promise<void> {
		const detail = this.detail(label);
		await expect(detail).toBeVisible({ timeout: 30_000 });
		if (value !== undefined) await expect(detail).toContainText(value);
	}

	/** Expose/Hide switches the info card between the compact and full detail set. */
	async toggleFullMode(): Promise<void> {
		await this.page.getByRole('button', { name: /^(Expose|Hide)$/ }).click();
	}

	testRow(testName: string): Locator {
		return this.page.locator(
			`[data-testid="run-row"][data-test-name="${testName}"]`
		);
	}

	resultTable(testName: string): Locator {
		return this.page.locator(
			`[data-testid="run-result-table"][data-test-name="${testName}"]`
		);
	}

	/**
	 * Count badges carry their run-table column id (`RUN`, `PASSED_EXPECTED`,
	 * ...); clicking one on a test row opens that test's result table filtered to
	 * the column, and on a package row expands the subtree instead. Which columns
	 * are visible is user state, so prefer `firstCountBadge` over naming one.
	 */
	countBadge(row: Locator, columnId: string): Locator {
		return row.locator(
			`[data-testid="tw-badge"][data-column-id="${columnId}"]`
		);
	}

	firstCountBadge(row: Locator): Locator {
		return row.locator('[data-testid="tw-badge"][data-column-id]').first();
	}

	/** The tree cell is a button labelled with the node name; it toggles the row. */
	async toggleTreeNode(row: Locator): Promise<void> {
		await row.getByRole('button').first().click();
	}

	testRows(): Locator {
		return this.page.locator('[data-testid="run-row"][data-node-type="test"]');
	}

	/**
	 * A run opens with only its root expanded, so tests are several packages deep.
	 * Walk down the first collapsed package until a test row surfaces.
	 */
	async expandUntilTestRow(maxDepth = 10): Promise<Locator> {
		for (let depth = 0; depth < maxDepth; depth += 1) {
			if (await this.testRows().first().isVisible()) break;

			const collapsed = this.packageRows({ expanded: false }).first();
			await expect(collapsed).toBeVisible({ timeout: 30_000 });
			await this.toggleTreeNode(collapsed);
		}

		const testRow = this.testRows().first();
		await expect(testRow).toBeVisible({ timeout: 30_000 });
		return testRow;
	}

	async expectRowCountAbove(previous: number): Promise<void> {
		await expect
			.poll(() => this.rows().count(), { timeout: 30_000 })
			.toBeGreaterThan(previous);
	}

	async openCompareForm(): Promise<Locator> {
		await this.page
			.getByRole('button', { name: 'Compare', exact: true })
			.first()
			.click();

		const form = this.page.locator('form').filter({ hasText: 'Compare Runs' });
		await expect(form).toBeVisible({ timeout: 15_000 });
		return form;
	}

	async openReports(): Promise<void> {
		await this.page.getByRole('button', { name: 'Reports' }).click();
	}
}

export { RunPage };
