/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { exactText } from '../support/e2e-data';
import { UrlParams, urlParams } from '../support/url-params';

type ResultColumn =
	| 'obtained-result'
	| 'artifacts'
	| 'parameters'
	| 'requirements';

type ResultFilterTitle =
	| 'Obtained Result'
	| 'Result Type'
	| 'Verdicts'
	| 'Artifacts'
	| 'Parameters';

interface DiscriminatingResultBadge {
	column: ResultColumn;
	text: string;
	rowIndex: number;
	matchingRows: number;
	totalRows: number;
}

type ObtainedResultPart = 'all' | 'result' | 'verdicts';

const RUN_URL_PARAMS = {
	expanded: {
		codec: 'lz-string compressed JSON',
		values: 'a map of row id to true',
		whenAbsent: 'the first row is expanded',
		writtenBy:
			'the tree toggles. Migrated on mount from plain JSON and from dot-separated legacy row ids'
	},
	sorting: {
		codec: 'lz-string compressed JSON',
		values: 'a tanstack SortingState',
		whenAbsent: 'the rows are in tree order',
		writtenBy: 'the column headers'
	},
	globalFilter: {
		codec: 'lz-string compressed JSON',
		values: 'a list of strings',
		whenAbsent: 'no toolbar filter is applied',
		writtenBy: 'the toolbar search'
	},
	rowState: {
		codec: 'lz-string compressed JSON',
		values: 'per-row result-table state',
		whenAbsent: 'no result table is open',
		writtenBy: 'opening a result table from a count badge'
	},
	visibility: {
		codec: 'lz-string compressed JSON',
		values: 'a tanstack VisibilityState',
		whenAbsent:
			'localStorage `run-column-visibility[:projectId]`, then the computed default — the URL wins over both',
		writtenBy: 'the Columns menu'
	},
	columnFilters: {
		codec: 'lz-string compressed JSON, written with replaceIn',
		values: 'a map of row id to a tanstack ColumnFiltersState',
		whenAbsent: 'no result-table filter is applied',
		writtenBy: 'result badges and the faceted filters'
	},
	columnOrder: {
		codec: 'JsonParam — plain JSON, *not* compressed',
		values: 'a list of column ids',
		whenAbsent:
			'localStorage `run-column-order[:projectId]`, then the default order',
		writtenBy: 'dragging a column; written to the URL and localStorage both'
	},
	globalRequirements: {
		codec: 'ArrayParam — the key is repeated once per value',
		values: 'requirement names',
		whenAbsent: 'no requirement filter is applied',
		writtenBy: 'the requirements filter'
	},
	targetIterationId: {
		codec: 'NumberParam',
		values: 'an iteration id',
		whenAbsent: 'nothing is targeted',
		writtenBy: 'links that open a run at one iteration'
	},
	resultFilter: {
		codec: 'StringParam',
		values: 'a result column id',
		whenAbsent: 'no column is pre-filtered',
		writtenBy: 'incoming links only — the table does not write it back'
	}
} as const;

type RunUrlParam = keyof typeof RUN_URL_PARAMS;

const RUN_COMPRESSED_URL_PARAMS = [
	'expanded',
	'sorting',
	'globalFilter',
	'rowState',
	'visibility',
	'columnFilters'
] as const satisfies readonly RunUrlParam[];

class RunPage {
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.url = urlParams(page);
	}

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

	packageRows(options: { expanded?: boolean } = {}): Locator {
		const expanded =
			options.expanded === undefined
				? ''
				: `[data-expanded="${options.expanded}"]`;

		return this.page.locator(
			`[data-testid="run-row"]:not([data-node-type="test"])${expanded}`
		);
	}

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

	async toggleFullMode(): Promise<void> {
		await this.page.getByRole('button', { name: /^(Expose|Hide)$/ }).click();
	}

	testRow(testName: string): Locator {
		return this.page.locator(
			`[data-testid="run-row"][data-test-name="${testName}"]`
		);
	}

	testNodeRow(testName: string): Locator {
		return this.page.locator(
			`[data-testid="run-row"][data-node-type="test"][data-test-name="${testName}"]`
		);
	}

	resultTable(testName: string): Locator {
		return this.page.locator(
			`[data-testid="run-result-table"][data-test-name="${testName}"]`
		);
	}

	countBadge(row: Locator, columnId: string): Locator {
		return row.locator(
			`[data-testid="tw-badge"][data-column-id="${columnId}"]`
		);
	}

	firstCountBadge(row: Locator): Locator {
		return row.locator('[data-testid="tw-badge"][data-column-id]').first();
	}

	async toggleTreeNode(row: Locator): Promise<void> {
		await row.getByRole('button').first().click();
	}

	testRows(): Locator {
		return this.page.locator('[data-testid="run-row"][data-node-type="test"]');
	}

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

	async expandPackagePath(packageNames: string[]): Promise<void> {
		for (const name of packageNames) {
			const row = this.page
				.locator(
					`[data-testid="run-row"]:not([data-node-type="test"])[data-test-name="${name}"]`
				)
				.first();

			if (!(await row.isVisible())) continue;

			if ((await row.getAttribute('data-expanded')) === 'true') continue;

			await this.toggleTreeNode(row);
			await expect(row).toHaveAttribute('data-expanded', 'true', {
				timeout: 30_000
			});
		}
	}

	async openResultTableAt(
		packageNames: string[],
		testName: string
	): Promise<Locator> {
		await this.showColumn('Total');
		await this.expandPackagePath(packageNames);

		const testRow = this.testNodeRow(testName).first();
		await expect(testRow).toBeVisible({ timeout: 60_000 });
		await this.countBadge(testRow, 'TOTAL').first().click();

		const table = this.resultTable(testName).first();
		await expect(table).toBeVisible({ timeout: 60_000 });
		await expect
			.poll(() => this.resultRowCount(table), { timeout: 60_000 })
			.toBeGreaterThan(1);

		return table;
	}

	resultCells(table: Locator, columnId: ResultColumn): Locator {
		return table.locator(`[data-column-id="${columnId}"]`);
	}

	resultRowCount(table: Locator): Promise<number> {
		return this.resultCells(table, 'obtained-result').count();
	}

	obtainedResultBadge(table: Locator, index = 0): Locator {
		return this.resultCells(table, 'obtained-result')
			.nth(index)
			.getByTestId('tw-badge')
			.first();
	}

	verdictBadges(table: Locator, index = 0): Locator {
		return this.resultCells(table, 'obtained-result')
			.nth(index)
			.getByTestId('tw-badge');
	}

	artifactBadges(table: Locator, index = 0): Locator {
		return this.resultCells(table, 'artifacts')
			.nth(index)
			.getByTestId('tw-badge');
	}

	parameterButtons(table: Locator, index = 0): Locator {
		return this.resultCells(table, 'parameters').nth(index).locator('button');
	}

	requirementBadges(table: Locator, index = 0): Locator {
		return this.resultCells(table, 'requirements')
			.nth(index)
			.getByTestId('tw-badge');
	}

	async clickResultBadge(
		table: Locator,
		columnId: ResultColumn,
		text: string
	): Promise<void> {
		const items =
			columnId === 'parameters'
				? this.resultCells(table, columnId).locator('button')
				: this.resultCells(table, columnId).getByTestId('tw-badge');

		await items
			.filter({ hasText: exactText(text) })
			.first()
			.click();
	}

	async resultValuesByRow(
		table: Locator,
		columnId: ResultColumn,
		part: ObtainedResultPart = 'all'
	): Promise<string[][]> {
		return table.evaluate(
			(root, { column, part: which }) => {
				const cells = Array.from(
					root.querySelectorAll(`[data-column-id="${column}"]`)
				);

				return cells.map((cell) => {
					const items = Array.from(
						cell.querySelectorAll('[data-testid="tw-badge"], button')
					).map((item) => (item.textContent ?? '').trim());

					if (which === 'result') return items.slice(0, 1);
					if (which === 'verdicts') return items.slice(1);

					return items;
				});
			},
			{ column: columnId, part }
		);
	}

	async pickDiscriminatingResultBadge(
		table: Locator,
		columnId: ResultColumn,
		part: ObtainedResultPart = 'all'
	): Promise<DiscriminatingResultBadge> {
		const byRow = await this.resultValuesByRow(table, columnId, part);
		const counts = new Map<string, number[]>();

		for (const [rowIndex, values] of byRow.entries()) {
			for (const value of new Set(values)) {
				counts.set(value, [...(counts.get(value) ?? []), rowIndex]);
			}
		}

		for (const [text, rows] of counts) {
			if (rows.length === byRow.length || !text) continue;

			return {
				column: columnId,
				text,
				rowIndex: rows[0],
				matchingRows: rows.length,
				totalRows: byRow.length
			};
		}

		throw new Error(
			`No value in the result table's "${columnId}" column is carried by only some of its ${byRow.length} rows, so clicking one cannot be observed. Check the fixture plan.`
		);
	}

	async expectResultRowsNarrowedTo(
		table: Locator,
		columnId: ResultColumn,
		text: string,
		expectedRows: number,
		part: ObtainedResultPart = 'all'
	): Promise<void> {
		await expect
			.poll(() => this.resultRowCount(table), {
				timeout: 15_000,
				message: `result rows after filtering by "${text}"`
			})
			.toBe(expectedRows);

		const byRow = await this.resultValuesByRow(table, columnId, part);
		expect(byRow).toHaveLength(expectedRows);
		for (const values of byRow) {
			expect(values).toContain(text);
		}
	}

	async expectResultRowsNarrowedByResult(
		table: Locator,
		text: string,
		before: number
	): Promise<void> {
		await expect
			.poll(() => this.resultRowCount(table), {
				timeout: 15_000,
				message: `result rows after filtering by "${text}"`
			})
			.toBeLessThan(before);

		const byRow = await this.resultValuesByRow(
			table,
			'obtained-result',
			'result'
		);

		expect(byRow.length).toBeGreaterThan(0);
		for (const values of byRow) {
			expect(values).toContain(text);
		}
	}

	get filtersToggle(): Locator {
		return this.page.getByRole('button', { name: 'Filters' });
	}

	facetedFilter(table: Locator, title: ResultFilterTitle): Locator {
		return table.getByRole('button', { name: new RegExp(`^${title}`) }).first();
	}

	async expectToolbarVisible(table: Locator): Promise<void> {
		await expect(this.facetedFilter(table, 'Obtained Result')).toBeVisible({
			timeout: 15_000
		});
	}

	async expectToolbarHidden(table: Locator): Promise<void> {
		await expect(this.facetedFilter(table, 'Obtained Result')).toBeHidden({
			timeout: 15_000
		});
	}

	async expectFacetedFilterReports(
		table: Locator,
		title: ResultFilterTitle,
		label: string
	): Promise<void> {
		await expect(this.facetedFilter(table, title)).toContainText(label, {
			timeout: 15_000
		});
	}

	async expectNoFacetedFilterSelection(table: Locator): Promise<void> {
		for (const title of [
			'Obtained Result',
			'Result Type',
			'Verdicts',
			'Artifacts',
			'Parameters'
		] as const) {
			await expect(this.facetedFilter(table, title)).toHaveText(title, {
				timeout: 15_000
			});
		}
	}

	async resetResultFilters(table: Locator): Promise<void> {
		await table
			.getByRole('button', { name: 'Reset', exact: true })
			.first()
			.click();
	}

	async expectColumnFiltersInUrl(): Promise<void> {
		await this.url.expectWritten('columnFilters');
	}

	async gotoWithParams(
		runId: number,
		params: Record<string, string | string[]>
	): Promise<void> {
		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			for (const item of Array.isArray(value) ? value : [value]) {
				searchParams.append(key, item);
			}
		}

		const search = searchParams.size ? `?${searchParams.toString()}` : '';
		await this.page.goto(`runs/${runId}${search}`);
		await expect(this.page).toHaveURL(new RegExp(`/runs/${runId}`));
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsPresent(keys: readonly string[]): Promise<void> {
		await this.url.expectPresent(keys);
	}

	async expectParamsAbsent(keys: readonly string[]): Promise<void> {
		await this.url.expectAbsent(keys);
	}

	paramValue(key: string): string | null {
		return this.url.get(key);
	}

	async expectRepeatedParam(
		key: string,
		values: readonly string[]
	): Promise<void> {
		await this.url.expectRepeated(key, values);
	}

	async expectCompressedParams(
		keys: readonly string[] = RUN_COMPRESSED_URL_PARAMS
	): Promise<void> {
		for (const key of keys) await this.url.expectWritten(key);
	}

	async expectParamsUnchangedWhile(
		keys: readonly string[],
		action: () => Promise<void>
	): Promise<void> {
		await this.url.expectUnchangedWhile(keys, action);
	}

	captureLink(): string {
		return this.page.url();
	}

	async expandedRowNames(): Promise<string[]> {
		return this.page
			.locator('[data-testid="run-row"][data-expanded="true"]')
			.evaluateAll((rows) =>
				rows.map((row) => row.getAttribute('data-test-name') ?? '')
			);
	}

	async expectExpandedRowNames(names: readonly string[]): Promise<void> {
		await expect
			.poll(async () => (await this.expandedRowNames()).sort(), {
				timeout: 30_000,
				message: 'expanded rows'
			})
			.toEqual([...names].sort());
	}

	async visibleColumnLabels(): Promise<string[]> {
		return this.page
			.getByTestId('run-table')
			.locator('thead th')
			.evaluateAll((cells) =>
				cells.map((cell) => (cell.textContent ?? '').trim()).filter(Boolean)
			);
	}

	get columnsMenuTrigger(): Locator {
		return this.page
			.getByTestId('run-table-toolbar')
			.getByRole('button', { name: /Columns/ });
	}

	async openColumnsMenu(): Promise<void> {
		await this.columnsMenuTrigger.click();
		await expect(this.page.getByRole('menu')).toBeVisible({ timeout: 15_000 });
	}

	async toggleColumn(label: string): Promise<void> {
		await this.openColumnsMenu();
		await this.page.getByRole('menu').getByText(label, { exact: true }).click();
		await this.page.keyboard.press('Escape');
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

	commentValue(): Locator {
		return this.page.getByTestId('run-comment-value');
	}

	async openCommentEditor(): Promise<void> {
		await this.page
			.getByRole('banner')
			.getByRole('button', { name: 'Edit', exact: true })
			.click();
		await expect(
			this.page.getByRole('heading', { name: 'Edit Comment' })
		).toBeVisible({ timeout: 15_000 });
	}

	async submitComment(comment: string): Promise<void> {
		const textarea = this.page.getByPlaceholder('Run comment...');
		await textarea.fill(comment);
		await this.page
			.getByRole('button', {
				name: comment === '' ? 'Delete' : /^(Create|Update)$/
			})
			.click();
	}

	async expectComment(comment: string): Promise<void> {
		await expect(this.commentValue()).toHaveText(comment, { timeout: 15_000 });
	}

	async expectNoComment(): Promise<void> {
		await expect(this.commentValue()).toHaveText('—', { timeout: 15_000 });
	}

	async showColumn(label: string): Promise<void> {
		await this.toolbar.getByRole('button', { name: 'Columns' }).click();
		const menu = this.page.getByRole('menu');
		await expect(menu).toBeVisible({ timeout: 15_000 });
		await menu.getByText(label, { exact: true }).click();
		await this.page.keyboard.press('Escape');
		await expect(menu).toBeHidden({ timeout: 15_000 });
	}

	noteCell(row: Locator): Locator {
		return row.getByTestId('run-note-cell');
	}

	notePopover(heading: string): Locator {
		return this.page
			.getByRole('dialog')
			.filter({ has: this.page.getByRole('heading', { name: heading }) });
	}

	async addNote(row: Locator, note: string): Promise<void> {
		await this.noteCell(row).getByRole('button', { name: 'Add Note' }).click();

		const popover = this.notePopover('Add Note');
		await expect(popover).toBeVisible({ timeout: 15_000 });
		await popover.getByPlaceholder('Example note...').fill(note);
		await popover.getByRole('button', { name: 'Submit' }).click();
		await expect(popover).toBeHidden({ timeout: 15_000 });
	}

	async expectNote(row: Locator, note: string): Promise<void> {
		await expect(this.noteCell(row).locator('pre')).toHaveText(note, {
			timeout: 30_000
		});
	}

	async expectNoNote(row: Locator): Promise<void> {
		await expect(
			this.noteCell(row).getByRole('button', { name: 'Add Note' })
		).toBeVisible({ timeout: 30_000 });
	}

	async deleteNote(row: Locator): Promise<void> {
		await this.noteCell(row).getByRole('button').first().click();

		const popover = this.notePopover('Notes');
		await expect(popover).toBeVisible({ timeout: 15_000 });
		await popover.getByRole('button', { name: 'Delete Note' }).first().click();

		const confirm = this.page.getByRole('alertdialog');
		await expect(confirm).toBeVisible({ timeout: 15_000 });
		await confirm.getByRole('button', { name: 'Delete' }).click();
		await this.page.keyboard.press('Escape');
	}

	compromiseTrigger(): Locator {
		return this.page.getByRole('button', { name: 'Compromised form' });
	}

	async openCompromiseForm(): Promise<Locator> {
		await this.compromiseTrigger().click();

		const form = this.page
			.locator('form')
			.filter({ hasText: 'Mark as compromised' });
		await expect(form).toBeVisible({ timeout: 15_000 });
		return form;
	}

	async markCompromised(values: {
		comment: string;
		bugId: string;
	}): Promise<void> {
		const form = await this.openCompromiseForm();
		await form.getByLabel('Comment').fill(values.comment);
		await form.getByLabel('Bug ID').fill(values.bugId);
		await form.getByRole('button', { name: 'Submit' }).click();
	}

	async removeCompromised(): Promise<void> {
		await this.compromiseTrigger().click();
		await this.page
			.getByRole('button', { name: 'Remove compomised status' })
			.click();
	}

	async expectCompromised(): Promise<void> {
		await expect(this.compromiseTrigger()).toHaveText(/Run is compromised/, {
			timeout: 30_000
		});
	}

	async expectNotCompromised(): Promise<void> {
		await expect(this.compromiseTrigger()).toHaveText(/Mark as compromised/, {
			timeout: 30_000
		});
	}

	async ensureNotCompromised(): Promise<void> {
		const trigger = this.compromiseTrigger();
		await expect(trigger).toBeVisible({ timeout: 30_000 });

		if (/Run is compromised/.test((await trigger.textContent()) ?? '')) {
			await this.removeCompromised();
		}

		await this.expectNotCompromised();
	}

	historyLink(testName: string): Locator {
		return this.resultTable(testName).getByRole('link', { name: 'History' });
	}

	async openResultHistoryMenu(testName: string): Promise<void> {
		await this.resultTable(testName)
			.locator('button[aria-haspopup="menu"]')
			.first()
			.click();
		await expect(this.page.getByRole('menu')).toBeVisible({ timeout: 15_000 });
	}

	async chooseHistoryLink(
		label: string,
		section: 'direct' | 'prefilled' = 'direct'
	): Promise<void> {
		const items = this.page.getByRole('menuitem', { name: label, exact: true });
		await (section === 'direct' ? items.first() : items.last()).click();
	}

	async openTestNodeHistory(row: Locator): Promise<void> {
		await row.getByTestId('tree-history-trigger').click();
		await this.page
			.getByRole('menuitem', { name: 'History View Of Results In The Run' })
			.click();
	}
}

export { RUN_COMPRESSED_URL_PARAMS, RUN_URL_PARAMS, RunPage };
export type {
	DiscriminatingResultBadge,
	ObtainedResultPart,
	ResultColumn,
	ResultFilterTitle
};
