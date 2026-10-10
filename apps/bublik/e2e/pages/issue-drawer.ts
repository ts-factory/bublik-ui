/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { optionName } from '../support/classification';
import { exactText } from '../support/e2e-data';

interface IssueInput {
	project?: string;
	title?: string;
	description?: string;
	tracker?: string;
	bugKey?: string;
	state?: 'Open' | 'Closed';
}

/**
 * The New Issue / Edit Issue drawer (`issue-drawer.container.tsx`).
 *
 * `Input` and `TextArea` overwrite the test id they are given, so the text
 * fields go by their labels; the selects have no accessible name, so they go
 * by the wrapper's test id and the combobox inside it.
 */
class IssueDrawer {
	readonly root: Locator;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId('issue-drawer');
	}

	get heading(): Locator {
		return this.root.getByText(/^(New|Edit) Issue$/);
	}

	get projectField(): Locator {
		return this.root.getByTestId('issue-project').getByRole('combobox');
	}

	get titleInput(): Locator {
		return this.root.getByLabel('Title', { exact: true });
	}

	get descriptionInput(): Locator {
		return this.root.getByLabel('Description', { exact: true });
	}

	get trackerInput(): Locator {
		return this.root
			.getByTestId('issue-tracker')
			.getByTestId('classify-tracker-input');
	}

	get bugKeyInput(): Locator {
		return this.root.getByLabel('Bug Key', { exact: true });
	}

	get stateField(): Locator {
		return this.root.getByTestId('issue-state').getByRole('combobox');
	}

	get submitButton(): Locator {
		return this.root.getByTestId('issue-submit');
	}

	get cancelButton(): Locator {
		return this.root.getByRole('button', { name: 'Cancel', exact: true });
	}

	get closeButton(): Locator {
		return this.root.getByRole('button', { name: 'Close', exact: true });
	}

	private async select(field: Locator, label: string): Promise<void> {
		await field.click();
		await this.page.getByRole('option', { name: optionName(label) }).click();
	}

	async fill(input: IssueInput): Promise<void> {
		if (input.project !== undefined) {
			await this.select(this.projectField, input.project);
		}
		if (input.title !== undefined) await this.titleInput.fill(input.title);
		if (input.description !== undefined) {
			await this.descriptionInput.fill(input.description);
		}
		if (input.tracker !== undefined) {
			await this.trackerInput.fill(input.tracker);
		}
		if (input.bugKey !== undefined) await this.bugKeyInput.fill(input.bugKey);
		if (input.state !== undefined) {
			await this.select(this.stateField, input.state);
		}
	}

	async submit(): Promise<void> {
		await this.submitButton.click();
	}

	async cancel(): Promise<void> {
		await this.cancelButton.click();
		await this.expectClosed();
	}

	async expectOpen(heading: 'New Issue' | 'Edit Issue'): Promise<void> {
		await expect(this.root).toBeVisible({ timeout: 15_000 });
		await expect(this.heading).toHaveText(heading);
	}

	async expectClosed(): Promise<void> {
		await expect(this.root).toBeHidden({ timeout: 15_000 });
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

	/**
	 * The alert over the form, titled "Error", that carries a server message
	 * no field claims, as "<label or path>: <message>".
	 */
	async expectFormError(message: RegExp): Promise<void> {
		const alert = this.root
			.getByText('Error', { exact: true })
			.locator('xpath=..');
		await expect(alert).toBeVisible({ timeout: 15_000 });
		await expect(alert).toContainText(message);
	}

	async expectNoValidation(message: string): Promise<void> {
		await expect(this.root.getByText(message, { exact: true })).toHaveCount(0);
	}

	async expectProjectFieldShown(shown: boolean): Promise<void> {
		await expect(this.root.getByTestId('issue-project')).toHaveCount(
			shown ? 1 : 0
		);
	}

	/** The picked state, as the badge the tables show, and its help line. */
	async expectState(state: 'open' | 'closed', hint: string): Promise<void> {
		await expect(
			this.stateField.locator(`[data-issue-state="${state}"]`)
		).toBeVisible();
		await expect(
			this.root.getByTestId('issue-state').getByTestId('select-hint')
		).toHaveText(hint);
	}

	async expectStateFieldShown(shown: boolean): Promise<void> {
		await expect(this.root.getByTestId('issue-state')).toHaveCount(
			shown ? 1 : 0
		);
	}

	async expectTracker(value: string): Promise<void> {
		await expect(this.trackerInput).toHaveValue(value, { timeout: 15_000 });
	}

	/**
	 * With the Tracker emptied, its list opens on `trackers` in that order.
	 * Leaves the Tracker empty and its list closed.
	 */
	async expectTrackerOptionsLeadWith(
		trackers: readonly string[]
	): Promise<void> {
		const options = this.root.getByTestId('classify-tracker-option');

		await this.trackerInput.fill('');
		if (!(await options.first().isVisible())) {
			await this.root
				.getByTestId('issue-tracker')
				.getByRole('button', { name: 'Open tracker list' })
				.click();
		}
		await expect
			.poll(
				async () => (await options.allTextContents()).slice(0, trackers.length),
				{
					timeout: 15_000,
					message: 'tracker options'
				}
			)
			.toEqual(trackers);
		await this.trackerInput.press('Escape');
		await expect(options).toHaveCount(0, { timeout: 15_000 });
	}

	async expectTitle(value: string): Promise<void> {
		await expect(this.titleInput).toHaveValue(value);
	}

	/** Each given field holds the value; the state select shows its label. */
	async expectValues(values: IssueInput): Promise<void> {
		const { project, title, description, tracker, bugKey, state } = values;

		if (project !== undefined) {
			await expect(this.projectField).toContainText(project);
		}
		if (title !== undefined) {
			await expect(this.titleInput).toHaveValue(title, { timeout: 15_000 });
		}
		if (description !== undefined) {
			await expect(this.descriptionInput).toHaveValue(description);
		}
		if (tracker !== undefined) {
			await expect(this.trackerInput).toHaveValue(tracker);
		}
		if (bugKey !== undefined) {
			await expect(this.bugKeyInput).toHaveValue(bugKey);
		}
		if (state !== undefined) {
			await expect(this.stateField).toHaveText(state);
		}
	}
}

export { IssueDrawer };
export type { IssueInput };
