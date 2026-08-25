/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Page } from '@playwright/test';

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
