/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { optionName, pickIssueOption } from '../support/classification';
import { exactText } from '../support/e2e-data';

type Disposition = 'Expected' | 'Unexpected' | 'Marked';
type CategoryLabel =
	| 'Defect'
	| 'Test Bug'
	| 'Env'
	| 'Known'
	| 'Flaky'
	| 'Investigate';

/**
 * The New Rule / Edit Rule drawer (`rule-drawer.container.tsx`).
 *
 * The selects have no accessible name, so each goes by its wrapper's test id
 * and the combobox inside; the badge inputs' labels point at nothing, so they
 * go by wrapper and placeholder.
 */
class RuleDrawer {
	readonly root: Locator;

	constructor(private readonly page: Page) {
		this.root = page.getByTestId('rule-drawer');
	}

	get heading(): Locator {
		return this.root.getByText(/^(New|Edit) Rule$/);
	}

	get projectField(): Locator {
		return this.root.getByTestId('rule-project').getByRole('combobox');
	}

	get issuePicker(): Locator {
		return this.root
			.getByTestId('rule-issue')
			.getByTestId('issue-picker-input');
	}

	get issuePickerClear(): Locator {
		return this.root
			.getByTestId('rule-issue')
			.getByTestId('issue-picker-clear');
	}

	get testInput(): Locator {
		return this.root
			.getByTestId('rule-test')
			.getByPlaceholder('Search test by name or path…');
	}

	get categoryField(): Locator {
		return this.root.getByTestId('rule-category').getByRole('combobox');
	}

	get expectedField(): Locator {
		return this.root.getByTestId('rule-expected').getByRole('combobox');
	}

	get activeField(): Locator {
		return this.root.getByTestId('rule-active').getByRole('combobox');
	}

	get parametersInput(): Locator {
		return this.root.getByTestId('rule-parameters').getByPlaceholder('env=ci');
	}

	get verdictsInput(): Locator {
		return this.root
			.getByTestId('rule-verdicts')
			.getByPlaceholder('Press Enter to add a verdict');
	}

	get tagsInput(): Locator {
		return this.root.getByTestId('rule-tags').getByPlaceholder('branch=main');
	}

	get matcherReadonly(): Locator {
		return this.root.getByTestId('rule-matcher-readonly');
	}

	get submitButton(): Locator {
		return this.root.getByTestId('rule-submit');
	}

	get closeButton(): Locator {
		return this.root.getByRole('button', { name: 'Close', exact: true });
	}

	private async select(field: Locator, label: string): Promise<void> {
		await field.click();
		await this.page.getByRole('option', { name: optionName(label) }).click();
	}

	async selectProject(name: string): Promise<void> {
		await this.select(this.projectField, name);
	}

	async pickIssue(title: string): Promise<void> {
		await pickIssueOption(
			this.page,
			this.root.getByTestId('rule-issue'),
			title
		);
	}

	/**
	 * Types the test's name, picks the suggestion whose full path is `pathStr`,
	 * then waits for the picker to resolve that path to a test id — a submit
	 * before it does is refused with "Select a test".
	 */
	async pickTest(testName: string, pathStr: string): Promise<void> {
		const resolved = this.page.waitForResponse(
			(response) =>
				response.url().includes('/tests/picker/') &&
				new URL(response.url()).searchParams.get('search') === pathStr
		);

		await this.testInput.fill(testName);
		const option = this.page
			.getByRole('option')
			.filter({ has: this.page.locator(`[title="${pathStr}"]`) })
			.first();
		await expect(option).toBeVisible({ timeout: 15_000 });
		await option.click();
		await expect(this.testInput).toHaveValue(pathStr);
		await resolved;
	}

	async setCategory(label: CategoryLabel): Promise<void> {
		await this.select(this.categoryField, label);
	}

	async setDisposition(label: Disposition): Promise<void> {
		await this.select(this.expectedField, label);
	}

	async setActive(active: boolean): Promise<void> {
		await this.select(this.activeField, active ? 'Active' : 'Inactive');
	}

	private async addBadges(input: Locator, values: string[]): Promise<void> {
		for (const value of values) {
			await input.fill(value);
			await input.press('Enter');
		}
	}

	async addVerdicts(values: string[]): Promise<void> {
		await this.addBadges(this.verdictsInput, values);
	}

	async addParameters(values: string[]): Promise<void> {
		await this.addBadges(this.parametersInput, values);
	}

	async addTags(values: string[]): Promise<void> {
		await this.addBadges(this.tagsInput, values);
	}

	async submit(): Promise<void> {
		await this.submitButton.click();
	}

	async close(): Promise<void> {
		await this.closeButton.click();
		await this.expectClosed();
	}

	async expectOpen(heading: 'New Rule' | 'Edit Rule'): Promise<void> {
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

	async expectProject(name: string): Promise<void> {
		await expect(this.projectField).toHaveText(name, { timeout: 15_000 });
	}

	/** The Parameters field shows `value` as an entered badge. */
	async expectParameterEntered(value: string): Promise<void> {
		await expect(
			this.root
				.getByTestId('rule-parameters')
				.getByRole('listitem')
				.filter({ hasText: exactText(value) })
		).toBeVisible({ timeout: 15_000 });
	}

	async expectNoValidationErrors(): Promise<void> {
		await expect(this.root.getByTestId('input-error-message')).toHaveCount(0);
	}

	async expectIssuePicked(title: string): Promise<void> {
		await expect(this.issuePicker).toHaveValue(title, { timeout: 15_000 });
	}

	async expectIssueLocked(): Promise<void> {
		await expect(this.issuePicker).toBeDisabled({ timeout: 15_000 });
		await expect(this.issuePickerClear).toHaveCount(0);
	}

	async expectTestDisabled(): Promise<void> {
		await expect(this.testInput).toBeDisabled({ timeout: 15_000 });
	}

	async expectProjectDisabled(): Promise<void> {
		await expect(this.projectField).toBeDisabled({ timeout: 15_000 });
	}

	async expectMatcherReadonly(): Promise<void> {
		await expect(this.matcherReadonly).toBeVisible({ timeout: 15_000 });
		await expect(this.root.getByTestId('rule-verdicts')).toHaveCount(0);
	}

	async expectCategory(label: CategoryLabel): Promise<void> {
		await expect(this.categoryField).toContainText(label);
	}

	async expectDisposition(label: Disposition): Promise<void> {
		await expect(this.expectedField).toContainText(label);
	}

	/** The help line under the Expected field, for the picked disposition. */
	async expectDispositionHint(hint: string): Promise<void> {
		await expect(
			this.root.getByTestId('rule-expected').getByTestId('select-hint')
		).toHaveText(hint);
	}

	async expectActive(active: boolean): Promise<void> {
		await expect(this.activeField).toContainText(
			active ? 'Active' : 'Inactive'
		);
	}
}

export { RuleDrawer };
export type { CategoryLabel, Disposition };
