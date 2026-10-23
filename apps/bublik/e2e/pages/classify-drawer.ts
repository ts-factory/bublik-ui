/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import {
	CATEGORY_BADGE,
	expectToast,
	optionName,
	pickIssueOption,
	uniqueBugKey
} from '../support/classification';
import { exactText } from '../support/e2e-data';
import { CATEGORY_LABELS } from './rule-drawer';
import type { CategoryLabel, Disposition } from './rule-drawer';

/** A match-scope field: one dimension the rules keep or drop. */
type MatchField = 'parameters' | 'verdicts' | 'tags';

/**
 * The pickers: a field whose values are picked one by one. The verdicts are
 * matched exactly, so their field keeps every list the results failed with
 * or drops them all.
 */
type PickedField = Exclude<MatchField, 'verdicts'>;

/** A category badge's label back to the slug its box is marked with. */
const CATEGORY_SLUG = Object.fromEntries(
	Object.entries(CATEGORY_BADGE).map(([slug, label]) => [label, slug])
) as Record<CategoryLabel, keyof typeof CATEGORY_BADGE>;

const MATCH_FIELDS: readonly MatchField[] = ['parameters', 'verdicts', 'tags'];

/** What an emptied picker says: the dimension is not matched on. */
const NONE_KEPT = 'None kept: not matched on';

/** What the Verdicts field says once dropped. */
const VERDICTS_DROPPED = 'Not kept: not matched on';

/**
 * The Classify Failure drawer (`classify-drawer.component.tsx`), opened from a
 * failing result's Classify button on the log and measurements pages, and
 * from the selection popover on the run page.
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

	/** The Category field: a button showing the picked categories' badges. */
	get categoryField(): Locator {
		return this.root.getByTestId('classify-category-trigger');
	}

	/** The Category list, open: one checkbox row per category. */
	get categoryPopup(): Locator {
		return this.page.getByTestId('classify-category-popup');
	}

	categoryOption(label: CategoryLabel): Locator {
		return this.categoryPopup.locator(
			`[data-testid="classify-category-option"][data-category="${CATEGORY_SLUG[label]}"]`
		);
	}

	get expectedField(): Locator {
		return this.root.getByTestId('classify-expected').getByRole('combobox');
	}

	get scopeField(): Locator {
		return this.root.getByTestId('classify-scope').getByRole('combobox');
	}

	/** A match dimension's field, its kept values shown as chips. */
	matchField(field: MatchField): Locator {
		return this.root.getByTestId(`match-scope-${field}`);
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

	/**
	 * A bug key is required, so one is made up unless the input brings its own;
	 * the tracker pre-fills from the project's config.
	 */
	async fillNewIssue(input: {
		title: string;
		tracker?: string;
		bugKey?: string;
	}): Promise<void> {
		await this.titleInput.fill(input.title);
		if (input.tracker !== undefined) {
			await this.trackerInput.fill(input.tracker);
		} else {
			await this.expectTrackerSeeded();
		}
		await this.bugKeyInput.fill(input.bugKey ?? uniqueBugKey());
	}

	/**
	 * The tracker pre-fills from the project's config once that has loaded; a
	 * submit before then has no tracker to resolve the key against.
	 */
	async expectTrackerSeeded(): Promise<void> {
		await expect(this.trackerInput).not.toHaveValue('', { timeout: 15_000 });
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

	/** Makes `label` the one picked category, as picking it from a select did. */
	async setCategory(label: CategoryLabel): Promise<void> {
		await this.setCategories([label]);
	}

	/** Picks exactly `labels`, unpicking the rest, and closes the list. */
	async setCategories(labels: readonly CategoryLabel[]): Promise<void> {
		await this.openCategories();

		for (const label of CATEGORY_LABELS) {
			const option = this.categoryOption(label);
			const wanted = labels.includes(label) ? 'checked' : 'unchecked';

			if ((await option.getAttribute('data-state')) !== wanted) {
				await option.click();
			}
		}

		await this.closeCategories();
		await this.expectCategories(labels);
	}

	/** Flips one category in the list, and closes the list. */
	async toggleCategory(label: CategoryLabel): Promise<void> {
		await this.openCategories();
		await this.categoryOption(label).click();
		await this.closeCategories();
	}

	async openCategories(): Promise<void> {
		await this.categoryField.click();
		await expect(this.categoryPopup).toBeVisible({ timeout: 15_000 });
	}

	async closeCategories(): Promise<void> {
		await this.page.keyboard.press('Escape');
		await expect(this.categoryPopup).toBeHidden({ timeout: 15_000 });
	}

	async setDisposition(label: Disposition): Promise<void> {
		await this.select(this.expectedField, label);
	}

	async setScope(
		label: 'This + future matching runs' | 'Just this result'
	): Promise<void> {
		await this.select(this.scopeField, label);
	}

	/** Empties a field from its bin, so the rules stop matching on it. */
	async clearMatch(field: MatchField): Promise<void> {
		await this.matchField(field)
			.getByRole('button', { name: `Clear ${field}`, exact: true })
			.click();
		await this.expectMatch({ [field]: false });
	}

	/** The values a picker keeps, as its chips show them; `data-value` is the value. */
	matchChips(field: PickedField): Locator {
		return this.matchField(field).getByTestId('scope-value-chip');
	}

	/** The values a picker keeps, as the matcher will send them. */
	async matchValues(field: PickedField): Promise<string[]> {
		return (
			await this.matchChips(field).evaluateAll((chips) =>
				chips.map((chip) => chip.getAttribute('data-value'))
			)
		).filter((value): value is string => value !== null);
	}

	/** Removes one kept value from a picker: the rules stop matching on it. */
	async removeMatchValue(field: PickedField, value: string): Promise<void> {
		const chip = this.matchField(field).locator(
			`[data-testid="scope-value-chip"][data-value="${value}"]`
		);
		await expect(chip).toHaveCount(1, { timeout: 15_000 });
		await chip.locator('[data-chip-remove]').click();
		await expect(chip).toHaveCount(0, { timeout: 15_000 });
	}

	/** Empties every picker from the section's bin: the rules match on their paths alone. */
	async clearAllMatch(): Promise<void> {
		await this.root
			.getByRole('button', {
				name: 'Empty every picker: match on the paths alone',
				exact: true
			})
			.click();
		await this.expectMatch({ parameters: false, verdicts: false, tags: false });
	}

	/**
	 * Submits and resolves with the id of the issue the results went under,
	 * read from the classify call's answer, once the stamp is acknowledged.
	 */
	async submitForIssueId(): Promise<number> {
		const classified = this.page.waitForResponse(
			(response) =>
				response.request().method() === 'POST' &&
				/\/results\/classify\/?(\?|$)/.test(response.url())
		);
		await this.submitButton.click();
		const response = await classified;
		if (!response.ok()) {
			throw new Error(
				`Classify answered ${response.status()}: ${await response.text()}`
			);
		}
		const { issue_id: issueId } = (await response.json()) as {
			issue_id: number;
		};
		await expectToast(this.page, /^Classified as /);
		await this.expectClosed();

		return issueId;
	}

	/** Restores the verdicts, every list the results failed with. */
	async restoreVerdicts(): Promise<void> {
		await this.matchField('verdicts')
			.getByRole('button', { name: 'Restore verdicts', exact: true })
			.click();
		await this.expectMatch({ verdicts: true });
	}

	/** Ticks every value back in a picker's list, as it started. */
	async keepAllMatch(field: PickedField): Promise<void> {
		await this.matchField(field)
			.getByRole('button', { name: `Open ${field} list`, exact: true })
			.click();
		const popup = this.page.getByTestId('scope-value-popup');
		await expect(popup).toBeVisible();
		const unticked = popup.locator(
			'[data-testid="scope-value-option"][aria-checked="false"]'
		);
		while ((await unticked.count()) > 0) {
			await unticked.first().click();
		}
		await this.page.keyboard.press('Escape');
		await expect(popup).toBeHidden();
		await this.expectMatch({ [field]: true });
	}

	/** Submits and waits for the stamp to be acknowledged. */
	async submit(): Promise<void> {
		await this.submitButton.click();
		await expectToast(this.page, /^Classified as /);
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

	/** The help line under the Category field, for the one picked category. */
	async expectCategoryHint(hint: string): Promise<void> {
		await expect(
			this.root.getByTestId('classify-category').getByTestId('select-hint')
		).toHaveText(hint);
	}

	/** The field shows exactly `labels`' badges. */
	async expectCategories(labels: readonly CategoryLabel[]): Promise<void> {
		for (const label of CATEGORY_LABELS) {
			const badge = this.categoryField.locator(
				`[data-category="${CATEGORY_SLUG[label]}"]`
			);

			await expect(badge).toHaveCount(labels.includes(label) ? 1 : 0, {
				timeout: 15_000
			});
		}
	}

	/** New issue, Investigate, Marked, future runs, every match dimension on. */
	async expectDefaults(): Promise<void> {
		await expect(this.modeField).toContainText('New issue');
		await this.expectCategories(['Investigate']);
		await expect(this.expectedField).toContainText('Marked');
		await expect(this.scopeField).toContainText('This + future matching runs');
		await this.expectMatch({ parameters: true, verdicts: true, tags: true });
	}

	/**
	 * Whether each named field is matched on. A kept picker is the one not
	 * emptied: a dimension the result carries nothing of has no chip either,
	 * and is not counted as dropped. The Verdicts field says when it is
	 * dropped.
	 */
	async expectMatch(
		fields: Partial<Record<MatchField, boolean>>
	): Promise<void> {
		for (const field of MATCH_FIELDS) {
			if (fields[field] === undefined) continue;

			const scope = this.matchField(field);
			const text =
				field === 'verdicts'
					? [scope, VERDICTS_DROPPED]
					: [scope.getByTestId('scope-value-trigger'), NONE_KEPT];
			const [where, dropped] = text as [Locator, string];
			if (fields[field]) {
				await expect(where).not.toContainText(dropped, { timeout: 15_000 });
			} else {
				await expect(where).toContainText(dropped, { timeout: 15_000 });
			}
		}
	}
}

export { ClassifyDrawer, MATCH_FIELDS };
export type { MatchField, PickedField };
