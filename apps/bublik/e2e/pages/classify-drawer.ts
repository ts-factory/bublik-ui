/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import {
	expectToast,
	optionName,
	pickIssueOption
} from '../support/classification';
import { exactText } from '../support/e2e-data';
import type { CategoryLabel, Disposition } from './rule-drawer';

type MatchFlag = 'matchParameters' | 'matchVerdicts' | 'matchTags';

type MatchPreset =
	| 'Path only'
	| 'Path + Verdicts'
	| 'Path + Parameters'
	| 'Path + Parameters + Verdicts'
	| 'Path + Parameters + Verdicts + Tags';

const MATCH_FLAGS: readonly MatchFlag[] = [
	'matchParameters',
	'matchVerdicts',
	'matchTags'
];

/**
 * The Classify Failure drawer (`classify-drawer.component.tsx`), opened from a
 * failing result's Classify button on the run, log and measurements pages.
 */
class ClassifyDrawer {
	readonly root: Locator;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId('classify-drawer');
	}

	get heading(): Locator {
		return this.root.getByText('Classify Failure', { exact: true });
	}

	get modeField(): Locator {
		return this.root.getByTestId('classify-mode').getByRole('combobox');
	}

	get titleInput(): Locator {
		return this.root.getByLabel('Title', { exact: true });
	}

	get trackerInput(): Locator {
		return this.root
			.getByTestId('classify-tracker')
			.getByTestId('classify-tracker-input');
	}

	get bugKeyInput(): Locator {
		return this.root.getByLabel('Bug Key', { exact: true });
	}

	get issuePicker(): Locator {
		return this.root
			.getByTestId('classify-issue')
			.getByTestId('issue-picker-input');
	}

	get categoryField(): Locator {
		return this.root.getByTestId('classify-category').getByRole('combobox');
	}

	get expectedField(): Locator {
		return this.root.getByTestId('classify-expected').getByRole('combobox');
	}

	get scopeField(): Locator {
		return this.root.getByTestId('classify-scope').getByRole('combobox');
	}

	get presetGroup(): Locator {
		return this.root.getByTestId('match-scope-preset');
	}

	preset(label: MatchPreset): Locator {
		return this.root.getByRole('radio', { name: label, exact: true });
	}

	flag(name: MatchFlag): Locator {
		return this.root.locator(
			`[data-testid="match-scope-flag"][data-flag="${name}"]`
		);
	}

	get submitButton(): Locator {
		return this.root.getByTestId('classify-submit');
	}

	get closeButton(): Locator {
		return this.root.getByRole('button', { name: 'Close', exact: true });
	}

	private async select(field: Locator, label: string): Promise<void> {
		await field.click();
		await this.page.getByRole('option', { name: optionName(label) }).click();
	}

	async setMode(mode: 'New issue' | 'Existing issue'): Promise<void> {
		await this.select(this.modeField, mode);
	}

	async fillNewIssue(input: {
		title: string;
		tracker?: string;
		bugKey?: string;
	}): Promise<void> {
		await this.titleInput.fill(input.title);
		if (input.tracker !== undefined) {
			await this.trackerInput.fill(input.tracker);
		}
		if (input.bugKey !== undefined) await this.bugKeyInput.fill(input.bugKey);
	}

	/**
	 * Clears the Tracker field (new-issue mode fills in the project's first
	 * tracker), which opens its list, and picks `tracker` from it.
	 */
	async pickTracker(tracker: string): Promise<void> {
		await this.trackerInput.fill('');
		const option = this.page
			.getByTestId('classify-tracker-popup')
			.getByTestId('classify-tracker-option')
			.filter({ hasText: exactText(tracker) });
		await expect(option).toBeVisible({ timeout: 15_000 });
		await option.click();
		await this.expectTracker(tracker);
	}

	/** Sets the whole Bug Key at once, the way a paste does. */
	async pasteBugKey(text: string): Promise<void> {
		await this.bugKeyInput.fill(text);
	}

	async expectTracker(value: string): Promise<void> {
		await expect(this.trackerInput).toHaveValue(value, { timeout: 15_000 });
	}

	async expectBugKey(value: string): Promise<void> {
		await expect(this.bugKeyInput).toHaveValue(value, { timeout: 15_000 });
	}

	async pickIssue(title: string): Promise<void> {
		await pickIssueOption(
			this.page,
			this.root.getByTestId('classify-issue'),
			title
		);
	}

	async setCategory(label: CategoryLabel): Promise<void> {
		await this.select(this.categoryField, label);
	}

	async setDisposition(label: Disposition): Promise<void> {
		await this.select(this.expectedField, label);
	}

	async setScope(
		label: 'This + future matching runs' | 'Just this result'
	): Promise<void> {
		await this.select(this.scopeField, label);
	}

	async choosePreset(label: MatchPreset): Promise<void> {
		await this.preset(label).click();
	}

	async toggleFlag(name: MatchFlag): Promise<void> {
		await this.flag(name).click();
	}

	/** Submits and waits for the stamp to be acknowledged. */
	async submit(): Promise<void> {
		await this.submitButton.click();
		await expectToast(this.page, 'Result classified');
		await this.expectClosed();
	}

	async submitExpectingValidation(...messages: string[]): Promise<void> {
		await this.submitButton.click();
		await this.expectValidation(...messages);
	}

	async close(): Promise<void> {
		await this.closeButton.click();
		await this.expectClosed();
	}

	async expectOpen(): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 15_000 });
		await expect(this.heading).toBeVisible();
	}

	async expectClosed(): Promise<void> {
		await expect(this.root).toBeHidden({ timeout: 30_000 });
	}

	async expectValidation(...messages: string[]): Promise<void> {
		for (const message of messages) {
			await expect(
				this.root
					.getByTestId('input-error-message')
					.filter({ hasText: exactText(message) })
			).toBeVisible({ timeout: 15_000 });
		}
	}

	/** The help line under the Category field, for the picked category. */
	async expectCategoryHint(hint: string): Promise<void> {
		await expect(
			this.root.getByTestId('classify-category').getByTestId('select-hint')
		).toHaveText(hint);
	}

	/** New issue, Known, Marked, future runs, every match dimension on. */
	async expectDefaults(): Promise<void> {
		await expect(this.modeField).toContainText('New issue');
		await expect(this.categoryField).toContainText('Known');
		await expect(this.expectedField).toContainText('Marked');
		await expect(this.scopeField).toContainText('This + future matching runs');
		await this.expectPreset('Path + Parameters + Verdicts + Tags');
		await this.expectFlags({
			matchParameters: true,
			matchVerdicts: true,
			matchTags: true
		});
	}

	async expectPreset(label: MatchPreset | 'Custom'): Promise<void> {
		await expect(this.presetGroup).toHaveAttribute('data-preset', label, {
			timeout: 15_000
		});
	}

	async expectFlags(flags: Record<MatchFlag, boolean>): Promise<void> {
		for (const name of MATCH_FLAGS) {
			await expect(this.flag(name)).toHaveAttribute(
				'data-state',
				flags[name] ? 'checked' : 'unchecked',
				{ timeout: 15_000 }
			);
		}
	}
}

export { ClassifyDrawer, MATCH_FLAGS };
export type { MatchFlag, MatchPreset };
