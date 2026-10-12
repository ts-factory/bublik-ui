/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

/** What the picker's popup says when it has no option to offer. */
type IssuePickerEmptyText =
	| 'Searching…'
	| 'No matches'
	| 'No issue classifies a result of this test yet'
	| 'No issues yet — classify a result to create one';

/**
 * The Issue picker (`issue-picker.container.tsx`) inside `field`: the rule
 * drawer's Issue field, the Classify drawer's in existing-issue mode, or the
 * history search form's, which is scoped to the form's test.
 *
 * The popup portals out of `field`, so it is looked up on the page; only one
 * picker is open at a time.
 */
class IssuePicker {
	constructor(private readonly page: Page, private readonly field: Locator) {}

	get input(): Locator {
		return this.field.getByTestId('issue-picker-input');
	}

	get openButton(): Locator {
		return this.field.getByRole('button', { name: 'Open issue list' });
	}

	get popup(): Locator {
		return this.page.getByTestId('issue-picker-popup');
	}

	get options(): Locator {
		return this.popup.getByTestId('issue-picker-option');
	}

	/** Opens the list with nothing typed: the picker's unfiltered offer. */
	async open(): Promise<void> {
		await this.openButton.click();
		await expect(this.popup).toBeVisible({ timeout: 15_000 });
	}

	async type(text: string): Promise<void> {
		await this.input.fill(text);
		await expect(this.popup).toBeVisible({ timeout: 15_000 });
	}

	async expectEmpty(text: IssuePickerEmptyText): Promise<void> {
		await expect(this.popup).toHaveText(text, { timeout: 15_000 });
		await expect(this.options).toHaveCount(0);
	}

	/** Exactly these issues are offered, in any order. */
	async expectOptions(issueIds: readonly number[]): Promise<void> {
		await expect
			.poll(
				async () =>
					(
						await this.options.evaluateAll((items) =>
							items.map((item) => Number(item.getAttribute('data-issue-id')))
						)
					).sort((a, b) => a - b),
				{ timeout: 15_000 }
			)
			.toEqual([...issueIds].sort((a, b) => a - b));
	}
}

export { IssuePicker };
export type { IssuePickerEmptyText };
