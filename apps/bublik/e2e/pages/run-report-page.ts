/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { UrlParams, urlParams } from '../support/url-params';

const SCROLLER_ID = 'page-container';
const TABLE_OF_CONTENTS_ID = 'run-report-table-of-contents';

interface GotoOptions {
	hash?: string;
	search?: string;
}

function attributeSelector(name: string, value: string): string {
	return `[${name}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`;
}

const RUN_REPORT_URL_PARAMS = {
	config: {
		codec: 'raw, required',
		values: 'a report config id',
		whenAbsent: 'the page reports the config as missing',
		writtenBy: 'the reports menu'
	},
	isFullMode: {
		codec: 'BooleanParam',
		values: '1 | 0',
		whenAbsent: 'the full run details are shown',
		writtenBy: "the header's run details toggle"
	},
	'selected-records': {
		codec: 'ArrayParam — the key is repeated once per value',
		values: 'record block ids',
		whenAbsent: 'nothing is selected for the stacked view',
		writtenBy: 'the Add to stacked buttons'
	},
	'stacked-drawer': {
		codec: 'BooleanParam',
		values: '1 | 0',
		whenAbsent: 'the drawer is closed',
		writtenBy: 'the Stacked button'
	}
} as const;

type RunReportUrlParam = keyof typeof RUN_REPORT_URL_PARAMS;

class RunReportPage {
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.url = urlParams(page);
	}

	async goto(
		runId: number,
		configId?: number,
		options: GotoOptions = {}
	): Promise<void> {
		const params = new URLSearchParams(options.search ?? '');
		if (configId) params.set('config', String(configId));

		const search = params.toString();
		const hash = options.hash ? `#${encodeURIComponent(options.hash)}` : '';

		await this.page.goto(
			`runs/${runId}/report${search ? `?${search}` : ''}${hash}`
		);
		await expect(this.page).toHaveURL(new RegExp(`/runs/${runId}/report`));
	}

	get root(): Locator {
		return this.page.getByTestId('run-report-page');
	}

	async expectLoaded(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 30_000 });
	}

	async expectNotLoaded(): Promise<void> {
		await expect(this.root).toHaveCount(0);
	}

	async expectMissingConfig(): Promise<void> {
		await expect(this.page.getByText('Config ID is missing')).toBeVisible({
			timeout: 15_000
		});
	}

	async expectConfigNotFound(configId: number): Promise<void> {
		await expect(
			this.page.getByText(`Config ${configId} not found`)
		).toBeVisible({ timeout: 30_000 });
		await this.expectNotLoaded();
	}

	async openConfigEditor(): Promise<void> {
		await this.root
			.getByRole('link', { name: 'Config', exact: true })
			.first()
			.click();
		await expect(this.page).toHaveURL(/\/admin\/config\?configId=/, {
			timeout: 15_000
		});
	}

	block(id: string): Locator {
		return this.page.locator(attributeSelector('id', encodeURIComponent(id)));
	}

	testBlock(id: string): Locator {
		return this.page.locator(
			`[data-testid="run-report-test-block"]${attributeSelector(
				'data-report-item-id',
				id
			)}`
		);
	}

	argValBlock(id: string): Locator {
		return this.page.locator(
			`[data-testid="run-report-arg-val-block"]${attributeSelector(
				'data-report-item-id',
				id
			)}`
		);
	}

	recordBlock(id: string): Locator {
		return this.page.locator(
			`[data-testid="run-report-record-block"]${attributeSelector(
				'data-report-item-id',
				id
			)}`
		);
	}

	async expectBlockVisible(id: string): Promise<void> {
		await expect(this.block(id)).toBeVisible({ timeout: 30_000 });
	}

	async expectBlockRendered(id: string): Promise<void> {
		await expect(this.block(id)).toHaveCount(1, { timeout: 30_000 });
	}

	private searchParams(): URLSearchParams {
		return new URL(this.page.url()).searchParams;
	}

	async expectHash(id: string): Promise<void> {
		await expect
			.poll(() => this.page.evaluate(() => window.location.hash), {
				timeout: 15_000,
				message: `expected the URL hash to anchor "${id}"`
			})
			.toBe(`#${encodeURIComponent(id)}`);
	}

	async expectTableOfContentsHash(): Promise<void> {
		await expect
			.poll(() => this.page.evaluate(() => window.location.hash), {
				timeout: 15_000
			})
			.toBe(`#${TABLE_OF_CONTENTS_ID}`);
	}

	async expectConfigParam(configId: number): Promise<void> {
		expect(this.searchParams().get('config')).toBe(String(configId));
	}

	async expectSearchParam(key: string, value: string | null): Promise<void> {
		await this.url.expect({ [key]: value });
	}

	async expectSearchParamValues(key: string, values: string[]): Promise<void> {
		await expect
			.poll(() => this.searchParams().getAll(key), { timeout: 15_000 })
			.toEqual(values);
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectParamsPresent(keys: readonly string[]): Promise<void> {
		await this.url.expectPresent(keys);
	}

	async expectBlockCollapsedInUrl(blockId: string): Promise<void> {
		await this.url.expect({ [blockId]: '0' });
	}

	async expectBlockNotCollapsedInUrl(blockId: string): Promise<void> {
		await this.url.expect({ [blockId]: null });
	}

	async expectParamsUnchangedWhile(
		keys: readonly string[],
		action: () => Promise<void>
	): Promise<void> {
		await this.url.expectUnchangedWhile(keys, action);
	}

	currentUrl(): string {
		return this.page.url();
	}

	async scrollTop(): Promise<number> {
		return this.page.evaluate(
			(id) => document.getElementById(id)?.scrollTop ?? -1,
			SCROLLER_ID
		);
	}

	async scrollToTop(): Promise<void> {
		await this.page.evaluate((id) => {
			document.getElementById(id)?.scrollTo({ top: 0, behavior: 'instant' });
		}, SCROLLER_ID);
		await this.waitForScrollToSettle();
	}

	private async blockOffsetFromScrollerTop(id: string): Promise<number | null> {
		return this.page.evaluate(
			([domId, scrollerId]) => {
				const element = document.getElementById(domId);
				const scroller = document.getElementById(scrollerId);

				if (!element || !scroller) return null;

				const offsetElement = element.closest<HTMLElement>('[data-offset]');
				const offset = Number(offsetElement?.dataset.offset || 0);

				return (
					element.getBoundingClientRect().top -
					scroller.getBoundingClientRect().top -
					offset
				);
			},
			[encodeURIComponent(id), SCROLLER_ID]
		);
	}

	private async isScrolledToEnd(): Promise<boolean> {
		return this.page.evaluate((id) => {
			const scroller = document.getElementById(id);
			if (!scroller) return false;

			return (
				scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 2
			);
		}, SCROLLER_ID);
	}

	private async waitForScrollToSettle(): Promise<void> {
		let previous = Number.NaN;
		let stableSamples = 0;

		await expect
			.poll(
				async () => {
					const current = await this.scrollTop();
					stableSamples = current === previous ? stableSamples + 1 : 0;
					previous = current;
					return stableSamples >= 2;
				},
				{
					timeout: 15_000,
					intervals: [100],
					message: 'the report never stopped scrolling'
				}
			)
			.toBe(true);
	}

	private async scrollAlignment(
		id: string,
		tolerancePx: number
	): Promise<string> {
		const offset = await this.blockOffsetFromScrollerTop(id);

		if (offset === null) return 'block is not rendered';
		if (Math.abs(offset) <= tolerancePx) return 'aligned';

		if (offset > 0 && (await this.isScrolledToEnd())) return 'aligned';

		return `off by ${Math.round(offset)}px`;
	}

	async expectScrolledTo(id: string, tolerancePx = 12): Promise<void> {
		let previous = Number.NaN;
		let stableSamples = 0;

		await expect
			.poll(
				async () => {
					const current = await this.scrollTop();
					stableSamples = current === previous ? stableSamples + 1 : 0;
					previous = current;

					if (stableSamples < 2) return 'still scrolling';

					return this.scrollAlignment(id, tolerancePx);
				},
				{
					timeout: 20_000,
					intervals: [100],
					message: `expected the report to be scrolled to "${id}"`
				}
			)
			.toBe('aligned');
	}

	async expectScrollerAtTop(): Promise<void> {
		await expect
			.poll(() => this.scrollTop(), {
				timeout: 15_000,
				message: 'expected the report to be at the top'
			})
			.toBe(0);
	}

	async expectScrolledToTableOfContents(): Promise<void> {
		await this.expectScrolledTo(TABLE_OF_CONTENTS_ID);
	}

	async expectScrolled(): Promise<void> {
		await expect
			.poll(() => this.scrollTop(), {
				timeout: 15_000,
				message: 'expected the report to have scrolled away from the top'
			})
			.toBeGreaterThan(0);
	}

	get tableOfContents(): Locator {
		return this.page.getByTestId('run-report-toc');
	}

	tocEntry(id: string): Locator {
		return this.page.locator(
			`[data-testid="run-report-toc-item"]${attributeSelector(
				'data-report-item-id',
				id
			)}`
		);
	}

	async expectTableOfContentsVisible(): Promise<void> {
		await expect(this.tableOfContents).toBeVisible({ timeout: 30_000 });
	}

	async expectTableOfContentsLists(ids: string[]): Promise<void> {
		for (const id of ids) {
			await expect(this.tocEntry(id)).toHaveCount(1, { timeout: 30_000 });
		}
	}

	async openTocEntry(id: string): Promise<void> {
		await this.tocEntry(id).getByTestId('run-report-toc-link').click();
	}

	async toggleTocEntry(id: string): Promise<void> {
		await this.tocEntry(id).getByTestId('run-report-toc-toggle').click();
	}

	async expectTocEntryExpanded(id: string): Promise<void> {
		await expect(this.tocEntry(id)).toHaveAttribute(
			'data-report-item-open',
			'true',
			{ timeout: 15_000 }
		);
	}

	async expectTocEntryCollapsed(id: string): Promise<void> {
		await expect(this.tocEntry(id)).toHaveAttribute(
			'data-report-item-open',
			'false',
			{ timeout: 15_000 }
		);
	}

	async expectTocEntryAbsent(id: string): Promise<void> {
		await expect(this.tocEntry(id)).toHaveCount(0, { timeout: 15_000 });
	}

	private async blurActiveElement(): Promise<void> {
		await this.page.evaluate(() => {
			const active = document.activeElement;
			if (active instanceof HTMLElement) active.blur();
		});
	}

	private async pressReportKey(key: string): Promise<void> {
		await this.blurActiveElement();
		await this.page.keyboard.press(key);
	}

	async pressNextArgValBlock(): Promise<void> {
		await this.pressReportKey('j');
	}

	async pressPreviousArgValBlock(): Promise<void> {
		await this.pressReportKey('k');
	}

	async pressTableOfContents(): Promise<void> {
		await this.pressReportKey('t');
	}

	async pressPairGainColumns(): Promise<void> {
		await this.pressReportKey('p');
	}

	nextArgValButton(argValBlockId: string): Locator {
		return this.argValBlock(argValBlockId).getByRole('button', {
			name: 'Next argument values'
		});
	}

	previousArgValButton(argValBlockId: string): Locator {
		return this.argValBlock(argValBlockId).getByRole('button', {
			name: 'Previous argument values'
		});
	}

	async clickNextArgValButton(argValBlockId: string): Promise<void> {
		await this.nextArgValButton(argValBlockId).click();
	}

	async clickPreviousArgValButton(argValBlockId: string): Promise<void> {
		await this.previousArgValButton(argValBlockId).click();
	}

	async expectNextArgValButtonDisabled(argValBlockId: string): Promise<void> {
		await expect(this.nextArgValButton(argValBlockId)).toBeDisabled();
	}

	async expectPreviousArgValButtonDisabled(
		argValBlockId: string
	): Promise<void> {
		await expect(this.previousArgValButton(argValBlockId)).toBeDisabled();
	}

	async clickTableOfContentsButton(testBlockId: string): Promise<void> {
		await this.testBlock(testBlockId)
			.getByRole('button', { name: 'Return to Table of Contents' })
			.click();
	}

	async expectGainColumnsPaired(testBlockId: string): Promise<void> {
		await expect(
			this.testBlock(testBlockId).getByRole('button', {
				name: 'Unpair Gain Columns'
			})
		).toBeVisible({ timeout: 15_000 });
	}

	async expectGainColumnsUnpaired(testBlockId: string): Promise<void> {
		await expect(
			this.testBlock(testBlockId).getByRole('button', {
				name: 'Pair Gain Columns'
			})
		).toBeVisible({ timeout: 15_000 });
	}

	async saveRecordLocation(recordId: string): Promise<void> {
		const record = this.recordBlock(recordId);
		await record.scrollIntoViewIfNeeded();
		await record.getByRole('link').first().click();
	}

	async expectLocationSaved(): Promise<void> {
		await expect(this.page.getByText('Saved location')).toBeVisible({
			timeout: 15_000
		});
	}

	cell(recordId: string, resultId: number): Locator {
		return this.recordBlock(recordId)
			.locator(
				`[data-testid="run-report-cell"]${attributeSelector(
					'data-result-id',
					String(resultId)
				)}`
			)
			.first();
	}

	get logPreview(): Locator {
		return this.page.getByTestId('log-preview-drawer');
	}

	async openLogPreview(recordId: string, resultId: number): Promise<void> {
		await this.recordBlock(recordId).scrollIntoViewIfNeeded();

		const cell = this.cell(recordId, resultId);
		await expect(cell).toBeVisible({ timeout: 30_000 });
		await cell.scrollIntoViewIfNeeded();
		await cell.click();
		await this.expectLogPreviewOpen();
	}

	async expectLogPreviewOpen(): Promise<void> {
		await expect(this.logPreview).toBeVisible({ timeout: 30_000 });
	}

	async expectLogPreviewClosed(): Promise<void> {
		await expect(this.logPreview).toHaveCount(0, { timeout: 15_000 });
	}

	async closeLogPreview(): Promise<void> {
		await this.page.keyboard.press('Escape');
		await this.expectLogPreviewClosed();
	}

	async expectLogPreviewLinks(runId: number, resultId: number): Promise<void> {
		const drawer = this.logPreview;

		await expect(
			drawer.getByRole('link', { name: 'Log', exact: true })
		).toHaveAttribute(
			'href',
			new RegExp(`/log/${runId}\\?.*focusId=${resultId}`)
		);
		await expect(
			drawer.getByRole('link', { name: 'Run', exact: true })
		).toHaveAttribute(
			'href',
			new RegExp(`/runs/${runId}\\?.*targetIterationId=${resultId}`)
		);
		await expect(
			drawer.getByRole('link', { name: 'Result', exact: true })
		).toHaveAttribute(
			'href',
			new RegExp(`/runs/${runId}/results/${resultId}/measurements`)
		);
	}

	stackedAddButton(recordId: string): Locator {
		return this.page.locator(
			`[data-testid="run-report-stacked-add"]${attributeSelector(
				'data-record-id',
				recordId
			)}`
		);
	}

	get stackedDrawer(): Locator {
		return this.page.getByTestId('run-report-stacked-drawer');
	}

	async addRecordToStacked(recordId: string): Promise<void> {
		await this.recordBlock(recordId).scrollIntoViewIfNeeded();
		const button = this.stackedAddButton(recordId);
		await expect(button).toBeVisible({ timeout: 30_000 });
		await button.click();
	}

	async expectSelectedChartCount(count: number): Promise<void> {
		const label = `${count} chart${count === 1 ? '' : 's'} selected`;
		await expect(this.page.getByRole('button', { name: label })).toBeVisible({
			timeout: 15_000
		});
	}

	async openStackedDrawer(): Promise<void> {
		const openButton = this.page.getByRole('button', {
			name: 'Stacked',
			exact: true
		});

		if (!(await openButton.isVisible())) {
			await this.page.getByRole('button', { name: /charts? selected/ }).click();
		}

		await openButton.click();
		await this.expectStackedDrawerOpen();
	}

	async expectStackedDrawerOpen(): Promise<void> {
		await expect(this.stackedDrawer).toBeVisible({ timeout: 30_000 });
		await expect(
			this.stackedDrawer.getByText('Stacked Chart', { exact: true })
		).toBeVisible({ timeout: 30_000 });
	}

	async toggleRunDetailsMode(): Promise<void> {
		await this.root
			.getByRole('button', { name: /^(Hide|Expose)$/ })
			.first()
			.click();
	}

	async expectRunDetailsFullMode(): Promise<void> {
		await expect(
			this.root.getByRole('button', { name: 'Hide' }).first()
		).toBeVisible({ timeout: 15_000 });
	}

	async expectRunDetailsShortMode(): Promise<void> {
		await expect(
			this.root.getByRole('button', { name: 'Expose' }).first()
		).toBeVisible({ timeout: 15_000 });
	}
}

export { RUN_REPORT_URL_PARAMS, RunReportPage };
export type { RunReportUrlParam };
