/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { escapeRegExp, type IssueCategory } from '../support/classification';
import { ClassifyDrawer } from './classify-drawer';
import { RunPage } from './run-page';

/** Stamp origin → the sentence a stamp's key tooltip gives for it alone. */
const STAMP_ORIGIN_DESCRIPTION = {
	import: 'Stamped automatically when the run was imported.',
	manual_persistent:
		'Stamped by hand — also applies to matching results in future imports.',
	manual_oneoff: 'Stamped by hand — applies to this result only.'
} as const;

/** Stamp origin → its short label, as a mixed-origin tooltip lists it. */
const STAMP_ORIGIN_LABEL = {
	import: 'Import',
	manual_persistent: 'Manual',
	manual_oneoff: 'One-off'
} as const;

type StampOrigin = keyof typeof STAMP_ORIGIN_LABEL;

/**
 * The issue stamps under a run's results, read one test's result table at a
 * time.
 *
 * A stamp is `display: contents` and carries its issue's id, so it is found by
 * that id across every row of a table; what it shows — the key, the category
 * badges, the tooltip — is read from inside it.
 */
class ResultStamps {
	private readonly run: RunPage;

	constructor(private readonly page: Page) {
		this.run = new RunPage(page);
	}

	/**
	 * Opens the results of the test at `path` (packages then the test) on the
	 * run page already open, through the test's Total badge. The Total column
	 * is shown only when it is not already: the Columns menu toggles, and the
	 * choice outlives the page in localStorage.
	 */
	async openTestResults(path: readonly string[]): Promise<Locator> {
		const testName = path[path.length - 1];
		await this.run.expandPackagePath(path.slice(0, -1));

		const testRow = this.run.testNodeRow(testName).first();
		await expect(testRow).toBeVisible({ timeout: 60_000 });
		if ((await this.run.countBadge(testRow, 'TOTAL').count()) === 0) {
			await this.run.showColumn('Total');
		}
		await this.run.countBadge(testRow, 'TOTAL').first().click();

		const table = this.run.resultTable(testName).first();
		await expect(table).toBeVisible({ timeout: 60_000 });
		await expect
			.poll(() => this.run.resultRowCount(table), { timeout: 60_000 })
			.toBeGreaterThan(0);

		return table;
	}

	/** Every stamp of `issueId` in `table`, one per result it lies on. */
	stampsOf(table: Locator, issueId: number): Locator {
		return table.locator(
			`[data-testid="result-issue-stamp"][data-issue-id="${issueId}"]`
		);
	}

	/** The results of `table` whose line carries a stamp of every one of `issueIds`. */
	resultsStampedBy(table: Locator, issueIds: readonly number[]): Locator {
		return issueIds.reduce(
			(cells, issueId) =>
				cells.filter({
					has: this.page.locator(
						`[data-testid="result-issue-stamp"][data-issue-id="${issueId}"]`
					)
				}),
			this.run.resultCells(table, 'obtained-result')
		);
	}

	async expectStamped(
		table: Locator,
		issueId: number,
		category: IssueCategory
	): Promise<void> {
		const stamps = this.stampsOf(table, issueId);
		await expect(stamps.first()).toBeAttached({ timeout: 30_000 });
		await expect(
			stamps.locator(`[data-category="${category}"]`).first()
		).toBeVisible({ timeout: 15_000 });
	}

	async expectNotStamped(table: Locator, issueId: number): Promise<void> {
		await expect(this.stampsOf(table, issueId)).toHaveCount(0, {
			timeout: 15_000
		});
	}

	/** `scope` — one result's line — carries exactly one stamp of `issueId`. */
	async expectSingleStamp(scope: Locator, issueId: number): Promise<void> {
		await expect(this.stampsOf(scope, issueId)).toHaveCount(1, {
			timeout: 30_000
		});
	}

	/**
	 * `table` lists exactly `count` results, each with a Classify button and
	 * none with a stamp.
	 */
	async expectUnstamped(table: Locator, count: number): Promise<void> {
		const results = this.run.resultCells(table, 'obtained-result');
		await expect(results).toHaveCount(count, { timeout: 30_000 });
		for (let index = 0; index < count; index += 1) {
			await expect(this.run.classifyTrigger(table, index)).toBeVisible();
		}
		await expect(
			table.locator('[data-testid="result-issue-stamp"]')
		).toHaveCount(0);
	}

	async openClassify(result: Locator): Promise<ClassifyDrawer> {
		await result.getByTestId('classify-trigger').click();
		const drawer = new ClassifyDrawer(this.page);
		await drawer.expectOpen();

		return drawer;
	}

	/** Hovers the stamp's key and expects its tooltip to read `text`. */
	async expectStampTooltip(
		stamp: Locator,
		text: string | RegExp
	): Promise<void> {
		await stamp.getByTestId('issue-key-link').hover();
		await expect(
			this.page.getByRole('tooltip').filter({ hasText: text }).first()
		).toBeVisible({ timeout: 15_000 });
		await this.page.mouse.move(0, 0);
	}

	async expectOrigin(
		stamp: Locator,
		issueTitle: string,
		origin: StampOrigin
	): Promise<void> {
		await this.expectStampTooltip(
			stamp,
			`${issueTitle}. ${STAMP_ORIGIN_DESCRIPTION[origin]}`
		);
	}

	async expectOrigins(
		stamp: Locator,
		issueTitle: string,
		origins: readonly StampOrigin[]
	): Promise<void> {
		// The labels come in the order the stamps were read, which the
		// tooltip does not promise; each must be listed, in any order.
		const listed = origins
			.map((origin) => `(?=[^)]*${escapeRegExp(STAMP_ORIGIN_LABEL[origin])})`)
			.join('');
		await this.expectStampTooltip(
			stamp,
			new RegExp(
				`${escapeRegExp(
					issueTitle
				)}\\. Stamped by several rules \\(${listed}[^)]*\\)\\.`
			)
		);
	}
}

export { ResultStamps };
export type { StampOrigin };
