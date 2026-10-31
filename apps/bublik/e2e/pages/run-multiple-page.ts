/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import {
	SIDEBAR_ALIASES,
	SIDEBAR_STATE_PARAM,
	encodeSidebarState
} from '../support/sidebar-state';
import { UrlParams, urlParams } from '../support/url-params';

const RUN_MULTIPLE_URL_PARAMS = {
	runIds: {
		codec: 'repeated key, one per run',
		values: 'run ids',
		whenAbsent: 'the page reports the run ids as missing',
		writtenBy: 'the runs selection popover'
	},
	selected: {
		codec: 'raw',
		values: 'one of the pinned run ids',
		whenAbsent: 'the first run of runIds is shown',
		writtenBy: 'the run links in the header'
	},
	isModeFull: {
		codec: 'BooleanParam',
		values: '1 | 0',
		whenAbsent: 'the compact details',
		writtenBy: 'the run details toggle'
	}
} as const;

type RunMultipleUrlParam = keyof typeof RUN_MULTIPLE_URL_PARAMS;

class RunMultiplePage {
	private readonly url: UrlParams;

	constructor(private readonly page: Page) {
		this.url = urlParams(page);
	}

	async goto(runIds: number[], selectedRunId?: number): Promise<void> {
		const params = new URLSearchParams();
		for (const runId of runIds) params.append('runIds', String(runId));
		if (selectedRunId) params.set('selected', String(selectedRunId));

		await this.page.goto(`multiple${params.toString() ? `?${params}` : ''}`);
		await expect(this.page).toHaveURL(/\/multiple(?:$|\?)/);
	}

	async gotoWithParams(
		params: Record<string, string | string[]>
	): Promise<void> {
		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			for (const item of Array.isArray(value) ? value : [value]) {
				searchParams.append(key, item);
			}
		}

		const search = searchParams.size ? `?${searchParams.toString()}` : '';
		await this.page.goto(`multiple${search}`);
		await expect(this.page).toHaveURL(/\/multiple(?:$|\?)/);
	}

	/** Opens the merged runs with the same runs selected, as the runs page's Multiple link leaves them. */
	async gotoWithRunsSelected(runIds: readonly number[]): Promise<void> {
		await this.gotoWithParams({
			runIds: runIds.map(String),
			[SIDEBAR_STATE_PARAM]: encodeSidebarState({
				[SIDEBAR_ALIASES.runsSelected]: runIds.map(String)
			})
		});
	}

	async expectParams(expected: Record<string, string | null>): Promise<void> {
		await this.url.expect(expected);
	}

	async expectRunIdsPinned(runIds: readonly number[]): Promise<void> {
		await this.url.expectRepeated('runIds', runIds.map(String));
	}

	async expectParamsUnchangedWhile(
		keys: readonly string[],
		action: () => Promise<void>
	): Promise<void> {
		await this.url.expectUnchangedWhile(keys, action);
	}

	async expectLoaded(): Promise<void> {
		await expect(this.page.getByTestId('run-multiple-page')).toBeVisible({
			timeout: 30_000
		});
	}

	async expectMissingRunsEmptyState(): Promise<void> {
		await expect(this.page.getByText('Run IDs are missing')).toBeVisible({
			timeout: 15_000
		});
	}

	async selectRun(runId: number): Promise<void> {
		await this.page
			.getByRole('link', { name: `Run ${runId}`, exact: true })
			.click();
		await expect(this.page).toHaveURL(new RegExp(`selected=${runId}`), {
			timeout: 15_000
		});
	}

	get selectionDock(): Locator {
		return this.page.getByTestId('selection-dock');
	}

	get runsSelectionPill(): Locator {
		return this.selectionDock.getByRole('button', {
			name: /^\d+ runs selected$/
		});
	}

	get resultsSelectionPill(): Locator {
		return this.selectionDock.getByTestId('results-selection-toggle');
	}

	/**
	 * Both selections' pills sit in the one dock, each with its full label,
	 * the results pill stacked above the runs pill, their right edges aligned.
	 */
	async expectSelectionsStacked(runs: number, results: number): Promise<void> {
		await expect(this.runsSelectionPill).toHaveText(`${runs} runs selected`, {
			timeout: 15_000
		});
		await expect(this.resultsSelectionPill).toHaveText(
			`${results} result${results === 1 ? '' : 's'} selected`
		);

		const [first, second] = await Promise.all([
			this.runsSelectionPill.boundingBox(),
			this.resultsSelectionPill.boundingBox()
		]);
		if (!first || !second) throw new Error('A selection pill is not laid out.');

		expect(
			second.y + second.height,
			'the results pill sits above the runs pill'
		).toBeLessThanOrEqual(first.y);
		expect(
			Math.abs(first.x + first.width - (second.x + second.width)),
			'the pills are right-aligned'
		).toBeLessThanOrEqual(1);
	}

	/** Opens one selection's panel from its pill; the other's closes. */
	async openSelectionPanel(which: 'runs' | 'results'): Promise<void> {
		const pill =
			which === 'runs' ? this.runsSelectionPill : this.resultsSelectionPill;

		if ((await pill.getAttribute('aria-expanded')) !== 'true') {
			await pill.click();
		}
		await expect(pill).toHaveAttribute('aria-expanded', 'true');
	}

	/** Only `which` selection's panel is open. */
	async expectOnlyPanelOpen(which: 'runs' | 'results'): Promise<void> {
		const runsOpen = which === 'runs';

		await expect(this.runsSelectionPill).toHaveAttribute(
			'aria-expanded',
			String(runsOpen)
		);
		await expect(this.resultsSelectionPill).toHaveAttribute(
			'aria-expanded',
			String(!runsOpen)
		);
		await expect(
			this.page.getByText('Selected Runs', { exact: true })
		).toHaveCount(runsOpen ? 1 : 0);
		await expect(
			this.page.getByTestId('results-selection-popover')
		).toHaveCount(runsOpen ? 0 : 1);
	}

	/** The selection pill counts `results` picked results across `runs` runs. */
	async expectSelectionSpans(results: number, runs: number): Promise<void> {
		const pill = this.page.getByTestId('results-selection-toggle');

		await expect(pill).toHaveAttribute('data-count', String(results), {
			timeout: 15_000
		});
		await expect(pill).toHaveAttribute('data-run-count', String(runs));
		await expect(pill).toContainText(`${results} results in ${runs} runs`);
	}

	async openSelectedLog(): Promise<void> {
		const multiplePage = this.page.getByTestId('run-multiple-page');

		await multiplePage.getByRole('link', { name: 'Log', exact: true }).click();
		await expect(this.page).toHaveURL(/\/log\/\d+(?:\?|$)/, {
			timeout: 15_000
		});
	}
}

export { RUN_MULTIPLE_URL_PARAMS, RunMultiplePage };
export type { RunMultipleUrlParam };
