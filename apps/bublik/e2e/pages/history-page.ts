/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page, Request } from '@playwright/test';

import { exactText } from '../support/e2e-data';
import { UrlParams, urlParams } from '../support/url-params';
import { HistoryGlobalSearchForm } from './history-global-search-form';

const HISTORY_MODES = [
	'linear',
	'aggregation',
	'measurements',
	'measurements-by-iteration',
	'measurements-combined'
] as const;

type HistoryMode = (typeof HISTORY_MODES)[number];

const HISTORY_LINEAR_COLUMNS = [
	'links',
	'start-duration',
	'metadata',
	'tags',
	'expected-results',
	'obtained-results',
	'parameters'
] as const;

const HISTORY_AGGREGATION_COLUMNS = ['results-log', 'parameters-hash'] as const;

type HistoryColumn =
	| (typeof HISTORY_LINEAR_COLUMNS)[number]
	| (typeof HISTORY_AGGREGATION_COLUMNS)[number];

type HistoryBadgePart = 'all' | 'result' | 'verdicts';

interface DiscriminatingHistoryBadge {
	column: HistoryColumn;
	text: string;
	rowIndex: number;
	matchingRows: number;
	totalRows: number;
}

type HistoryLegendItem =
	| 'runs'
	| 'iterations'
	| 'results'
	| 'expected'
	| 'unexpected';

const HISTORY_URL_PARAMS = {
	testName: {
		sentAs: 'test_name',
		values: 'test path',
		whenAbsent: 'the page asks for a test name instead of querying',
		writtenBy: 'the global search form'
	},
	hash: {
		sentAs: 'hash',
		values: 'iteration hash',
		whenAbsent: 'results are not narrowed by hash',
		writtenBy: 'the global search form'
	},
	parameters: {
		sentAs: 'test_args',
		values: '`;`-joined key=value pairs',
		whenAbsent: 'results are not narrowed by parameter',
		writtenBy: 'the global search form'
	},
	revisions: {
		sentAs: 'revisions',
		values: '`;`-joined revisions',
		whenAbsent: 'results are not narrowed by revision',
		writtenBy: 'the global search form'
	},
	branches: {
		sentAs: 'branches',
		values: '`;`-joined branches',
		whenAbsent: 'results are not narrowed by branch',
		writtenBy: 'the global search form'
	},
	labels: {
		sentAs: 'labels',
		values: '`;`-joined labels',
		whenAbsent: 'results are not narrowed by label',
		writtenBy: 'the global search form'
	},
	startDate: {
		sentAs: 'from_date',
		values: 'YYYY-MM-DD',
		whenAbsent: '31 days ago',
		writtenBy: 'the global search form date picker'
	},
	finishDate: {
		sentAs: 'to_date',
		values: 'YYYY-MM-DD',
		whenAbsent: 'today',
		writtenBy: 'the global search form date picker'
	},
	runData: {
		sentAs: 'tags',
		values: '`;`-joined run tags and metadata',
		whenAbsent: 'results are not narrowed by run data',
		writtenBy: 'the global search form'
	},
	runIds: {
		sentAs: 'run_ids',
		values: '`;`-joined run ids',
		whenAbsent: 'every run in the date range is queried',
		writtenBy: 'the global search form'
	},
	tagExpr: {
		sentAs: 'tag_expr',
		values: 'tag expression',
		whenAbsent: 'no tag expression is applied',
		writtenBy: 'the global search form expression field'
	},
	branchExpr: {
		sentAs: 'branch_expr',
		values: 'branch expression',
		whenAbsent: 'no branch expression is applied',
		writtenBy: 'the global search form expression field'
	},
	labelExpr: {
		sentAs: 'label_expr',
		values: 'label expression',
		whenAbsent: 'no label expression is applied',
		writtenBy: 'the global search form expression field'
	},
	testArgExpr: {
		sentAs: 'test_arg_expr',
		values: 'parameter expression',
		whenAbsent: 'no parameter expression is applied',
		writtenBy: 'the global search form expression field'
	},
	revisionExpr: {
		sentAs: 'rev_expr',
		values: 'revision expression',
		whenAbsent: 'no revision expression is applied',
		writtenBy: 'the global search form expression field'
	},
	verdictExpr: {
		sentAs: 'verdict_expr',
		values: 'verdict expression',
		whenAbsent: 'no verdict expression is applied',
		writtenBy: 'the global search form expression field'
	},
	runProperties: {
		sentAs: 'run_properties',
		values: '`;`-joined run properties',
		whenAbsent: 'not compromised runs only',
		writtenBy: 'the global search form result section'
	},
	resultProperties: {
		sentAs: 'result_types',
		values: '`;`-joined expected | unexpected',
		whenAbsent: 'both expected and unexpected',
		writtenBy: 'the global search form result section'
	},
	results: {
		sentAs: 'result_statuses',
		values: '`;`-joined PASSED | FAILED | KILLED | …',
		whenAbsent: 'every obtained result type',
		writtenBy: 'the global search form result section'
	},
	verdictLookup: {
		sentAs: 'verdict_lookup',
		values: 'string | regex | none',
		whenAbsent: 'string',
		writtenBy: 'the global search form verdict lookup picker'
	},
	verdict: {
		sentAs: 'verdict',
		values: '`;`-joined verdicts',
		whenAbsent: 'results are not narrowed by verdict',
		writtenBy: 'the global search form'
	},
	mode: {
		sentAs: null,
		values: HISTORY_MODES.join(' | '),
		whenAbsent: 'the list of results',
		writtenBy: 'the sidebar mode links; re-stamped by every form write'
	},
	page: {
		sentAs: 'page',
		values: '1-based page number',
		whenAbsent: 'the first page',
		writtenBy: 'the pagination control; forced back to 1 on submit'
	},
	pageSize: {
		sentAs: 'page_size',
		values: 'results per page',
		whenAbsent: '25',
		writtenBy: 'the pagination control'
	},
	combinedPlots: {
		sentAs: null,
		values: '`;`-joined chart ids',
		whenAbsent: 'the stacked view has nothing to draw',
		writtenBy: 'Add to combined chart, in the trend view'
	},
	'chart-group': {
		sentAs: null,
		values: 'trend | measurement',
		whenAbsent: 'no grouping is applied',
		writtenBy: 'the combined charts provider, which also clears it'
	},
	parametersByResultName: {
		sentAs: null,
		values: 'repeated chart name',
		whenAbsent: 'every chart is drawn',
		writtenBy: 'the Charts filter, in the series view'
	},
	parametersByResultFilter: {
		sentAs: null,
		values: 'repeated parameter name',
		whenAbsent: 'every parameter is drawn',
		writtenBy: 'the Parameters filter, in the series view'
	},
	project: {
		sentAs: 'project',
		values: 'project id, repeatable',
		whenAbsent: 'every project is queried',
		writtenBy: 'the sidebar project picker; re-appended by every form write'
	}
} as const;

type HistoryUrlParam = keyof typeof HISTORY_URL_PARAMS;

const HISTORY_SEARCH_FORM_PARAMS = [
	'testName',
	'hash',
	'labels',
	'parameters',
	'revisions',
	'branches',
	'runData',
	'tagExpr',
	'branchExpr',
	'labelExpr',
	'testArgExpr',
	'revisionExpr',
	'verdictExpr',
	'startDate',
	'finishDate',
	'runIds',
	'resultProperties',
	'runProperties',
	'results',
	'verdictLookup',
	'verdict'
] as const satisfies readonly HistoryUrlParam[];

class HistoryPage {
	readonly page: Page;
	readonly root: Locator;
	readonly editSearchButton: Locator;
	readonly submitButton: Locator;
	readonly resetFilterButton: Locator;
	readonly substringFilter: Locator;
	readonly legend: Locator;
	readonly table: Locator;
	readonly pagination: Locator;
	readonly globalSearchForm: HistoryGlobalSearchForm;
	private readonly url: UrlParams;

	constructor(page: Page) {
		this.page = page;
		this.root = page.getByTestId('history-page');
		this.editSearchButton = page.getByRole('button', { name: 'Edit Search' });
		this.submitButton = page.getByRole('button', { name: 'Submit' });
		this.resetFilterButton = page.getByRole('button', { name: 'Reset Filter' });
		this.substringFilter = page.getByPlaceholder('Substring filter');
		this.legend = this.root.getByTestId('history-legend-count');
		this.table = this.root.locator('[role="table"]').first();
		this.pagination = this.root.getByTestId('tw-pagination').first();
		this.globalSearchForm = new HistoryGlobalSearchForm(page);
		this.url = urlParams(page);
	}

	async goto(searchParams?: URLSearchParams | string): Promise<void> {
		const search =
			typeof searchParams === 'string'
				? searchParams
				: searchParams?.toString() ?? '';
		const url = search.length > 0 ? `history?${search}` : 'history';

		await this.page.goto(url);
		await expect(this.page).toHaveURL(/\/history(?:$|\?)/);
	}

	async gotoWithTestPath(
		testPath: string,
		extraParams?: Record<string, string>
	): Promise<void> {
		const params = new URLSearchParams({ testName: testPath });

		for (const [key, value] of Object.entries(extraParams ?? {})) {
			params.set(key, value);
		}

		await this.goto(params);
	}

	async gotoWithParams(params: Record<string, string>): Promise<void> {
		await this.goto(new URLSearchParams(params));
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsPresent(keys: readonly string[]): Promise<void> {
		await this.url.expectPresent(keys);
	}

	paramValue(key: string): string | null {
		return this.url.get(key);
	}

	paramValues(key: string): string[] {
		return this.url.getAll(key);
	}

	async expectDelimitedParam(key: string, ...values: string[]): Promise<void> {
		await this.url.expectDelimitedContains(key, ...values);
	}

	async expectRepeatedParam(
		key: string,
		values: readonly string[]
	): Promise<void> {
		await this.url.expectRepeated(key, values);
	}

	async expectParamsUnchangedWhile(
		keys: readonly string[],
		action: () => Promise<void>,
		settleMs = 2_000
	): Promise<void> {
		await this.url.expectUnchangedWhile(keys, action, settleMs);
	}

	waitForHistoryRequest(testPath?: string): Promise<Request> {
		return this.page.waitForRequest((request) => {
			const url = new URL(request.url());
			const isHistory =
				url.pathname.endsWith('/api/v2/history/') ||
				url.pathname.endsWith('/api/v2/history/grouped/');

			return (
				isHistory &&
				(!testPath || url.searchParams.get('test_name') === testPath)
			);
		});
	}

	async expectReady(): Promise<void> {
		await expect(this.editSearchButton).toBeVisible();
	}

	async expectModeReady(mode: HistoryMode): Promise<void> {
		await this.expectReady();
		await expect(this.root).toHaveAttribute('data-history-mode', mode, {
			timeout: 30_000
		});

		if (mode === 'linear' || mode === 'aggregation') {
			await expect(this.table).toBeVisible({ timeout: 60_000 });
			return;
		}

		await expect(this.chartsHeader(mode)).toBeVisible({ timeout: 60_000 });
	}

	chartsHeader(mode: HistoryMode): Locator {
		if (mode === 'measurements') return this.root.getByText('Trend Charts');
		if (mode === 'measurements-by-iteration') {
			return this.root.getByText('Series Charts');
		}

		return this.root
			.getByText('Charts', { exact: true })
			.or(this.root.getByText('You have not selected plots'))
			.first();
	}

	rows(): Locator {
		return this.table.locator('.tw-table-body [role="row"]');
	}

	async expectHasResults(): Promise<void> {
		await expect(this.rows().first()).toBeVisible({ timeout: 60_000 });
	}

	async expectNoResults(): Promise<void> {
		await expect(
			this.root.getByText('No results', { exact: true })
		).toBeVisible({ timeout: 60_000 });
	}

	async expectNoTestName(): Promise<void> {
		await expect(
			this.root.getByText('No test name', { exact: true })
		).toBeVisible({ timeout: 30_000 });
	}

	legendCount(item: HistoryLegendItem): Locator {
		return this.root.locator(`[data-legend-count="${item}"]`);
	}

	async expectLegendCountAtLeast(
		item: HistoryLegendItem,
		minimum: number
	): Promise<void> {
		await expect
			.poll(async () => Number(await this.legendCount(item).innerText()), {
				timeout: 60_000
			})
			.toBeGreaterThanOrEqual(minimum);
	}

	cells(columnId: HistoryColumn): Locator {
		return this.rows().locator(`[data-column-id="${columnId}"]`);
	}

	badges(columnId: HistoryColumn, rowIndex = 0): Locator {
		return this.cells(columnId)
			.nth(rowIndex)
			.locator('button[data-testid="tw-badge"]');
	}

	parameterBadges(rowIndex = 0): Locator {
		return this.badges('results-log', rowIndex);
	}

	obtainedResultBadge(
		rowIndex = 0,
		columnId: HistoryColumn = 'obtained-results'
	): Locator {
		return this.badges(columnId, rowIndex).first();
	}

	async badgeTextsByRow(
		columnId: HistoryColumn,
		part: HistoryBadgePart = 'all'
	): Promise<string[][]> {
		return this.table.evaluate(
			(root, { column, part: which }) => {
				const cells = Array.from(
					root.querySelectorAll(
						`.tw-table-body [role="row"] [data-column-id="${column}"]`
					)
				);

				return cells.map((cell) => {
					const blocks = Array.from(
						cell.querySelectorAll('[data-testid="tw-verdict-list"]')
					);
					const groups = (blocks.length ? blocks : [cell]).map((block) =>
						Array.from(
							block.querySelectorAll('button[data-testid="tw-badge"]')
						).map((badge) => (badge.textContent ?? '').trim())
					);

					if (which === 'result') {
						return groups.flatMap((items) => items.slice(0, 1));
					}

					if (which === 'verdicts') {
						return groups.flatMap((items) => items.slice(1));
					}

					return groups.flat();
				});
			},
			{ column: columnId, part }
		);
	}

	async pickDiscriminatingBadge(
		columnId: HistoryColumn,
		part: HistoryBadgePart = 'all'
	): Promise<DiscriminatingHistoryBadge> {
		const byRow = await this.badgeTextsByRow(columnId, part);
		const counts = new Map<string, { rows: number[] }>();

		for (const [rowIndex, texts] of byRow.entries()) {
			for (const text of new Set(texts)) {
				const entry = counts.get(text) ?? { rows: [] };
				entry.rows.push(rowIndex);
				counts.set(text, entry);
			}
		}

		for (const [text, { rows }] of counts) {
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
			`No badge in the "${columnId}" column is carried by only some of the ${byRow.length} listed rows, so clicking one cannot be observed. Check the fixture plan.`
		);
	}

	async clickBadge(
		columnId: HistoryColumn,
		rowIndex: number,
		text: string
	): Promise<void> {
		await this.badges(columnId, rowIndex)
			.filter({ hasText: exactText(text) })
			.first()
			.click();
	}

	async expectRowsNarrowedTo(
		columnId: HistoryColumn,
		text: string,
		before: number,
		part: HistoryBadgePart = 'all'
	): Promise<void> {
		await expect
			.poll(() => this.rows().count(), {
				timeout: 30_000,
				message: `rows after filtering by "${text}"`
			})
			.toBeLessThan(before);

		const byRow = await this.badgeTextsByRow(columnId, part);

		expect(byRow.length).toBeGreaterThan(0);
		for (const texts of byRow) {
			expect(texts).toContain(text);
		}
	}

	async expectBadgeSelected(
		columnId: HistoryColumn,
		text: string
	): Promise<void> {
		await expect(
			this.cells(columnId)
				.locator('button[data-testid="tw-badge"][data-badge-selected]')
				.filter({ hasText: exactText(text) })
				.first()
		).toBeVisible({ timeout: 15_000 });
	}

	async openCellContextMenu(
		columnId: HistoryColumn,
		rowIndex = 0
	): Promise<void> {
		await this.cells(columnId).nth(rowIndex).click({ button: 'right' });
		await expect(this.page.getByRole('menu')).toBeVisible({ timeout: 15_000 });
	}

	async chooseContextMenuItem(label: string): Promise<void> {
		await this.page
			.getByRole('menuitem', { name: label, exact: true })
			.first()
			.click();
	}

	async expectUrlUnchangedWhile(
		action: () => Promise<void>,
		settleMs = 2_000
	): Promise<void> {
		const before = new URL(this.page.url()).search;

		await action();
		// eslint-disable-next-line playwright/no-wait-for-timeout
		await this.page.waitForTimeout(settleMs);

		expect(new URL(this.page.url()).search).toBe(before);
	}

	async captureHistoryRequests(
		action: () => Promise<void>,
		settleMs = 2_000
	): Promise<Request[]> {
		const requests: Request[] = [];
		const listen = (request: Request) => {
			const { pathname } = new URL(request.url());

			if (
				pathname.endsWith('/api/v2/history/') ||
				pathname.endsWith('/api/v2/history/grouped/')
			) {
				requests.push(request);
			}
		};

		this.page.on('request', listen);
		try {
			await action();
			// eslint-disable-next-line playwright/no-wait-for-timeout
			await this.page.waitForTimeout(settleMs);
		} finally {
			this.page.off('request', listen);
		}

		return requests;
	}

	async sentHistoryRequestWithin(
		action: () => Promise<void>,
		withinMs = 2_000
	): Promise<boolean> {
		let sent = false;
		const listen = (request: { url(): string }) => {
			const { pathname } = new URL(request.url());

			if (
				pathname.endsWith('/api/v2/history/') ||
				pathname.endsWith('/api/v2/history/grouped/')
			) {
				sent = true;
			}
		};

		this.page.on('request', listen);
		try {
			await action();
			// eslint-disable-next-line playwright/no-wait-for-timeout
			await this.page.waitForTimeout(withinMs);
		} finally {
			this.page.off('request', listen);
		}

		return sent;
	}

	async openGlobalSearchForm(): Promise<void> {
		await this.editSearchButton.click();
		await this.globalSearchForm.expectVisible();
	}

	async searchForTestPath(testPath: string): Promise<void> {
		await this.openGlobalSearchForm();
		await this.globalSearchForm.fillTestPath(testPath);
		await this.globalSearchForm.applySearch();
		await this.globalSearchForm.expectHidden();
	}

	async openNextPage(): Promise<void> {
		await this.pagination.getByRole('button', { name: 'Next' }).click();
	}

	charts(): Locator {
		return this.root.getByTestId('tw-chart-control-panel');
	}

	async addChartToCombined(index: number): Promise<void> {
		await this.root
			.getByRole('button', { name: 'Add to combined chart' })
			.nth(index)
			.click();
	}

	async openStackedFromSelection(): Promise<void> {
		const stacked = this.page.getByRole('button', {
			name: 'Stacked',
			exact: true
		});

		if (!(await stacked.isVisible())) {
			await this.page
				.getByRole('button', { name: /chart\(s\) selected/i })
				.click();
		}

		await stacked.click();
	}
}

export {
	HISTORY_AGGREGATION_COLUMNS,
	HISTORY_LINEAR_COLUMNS,
	HISTORY_MODES,
	HISTORY_SEARCH_FORM_PARAMS,
	HISTORY_URL_PARAMS,
	HistoryPage
};
export type {
	DiscriminatingHistoryBadge,
	HistoryBadgePart,
	HistoryColumn,
	HistoryLegendItem,
	HistoryMode,
	HistoryUrlParam
};
