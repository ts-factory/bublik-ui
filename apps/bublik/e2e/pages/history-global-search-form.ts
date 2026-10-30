/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

import { pickIssueOption } from '../support/classification';

type VerdictLookupMode = 'String' | 'Regex' | 'None';

const VERDICT_LOOKUP_LABELS: Record<VerdictLookupMode, string> = {
	String: 'Lookup as string',
	Regex: 'Lookup as regex',
	None: 'Disable verdict lookup'
};

class HistoryGlobalSearchForm {
	readonly page: Page;
	readonly root: Locator;
	readonly heading: Locator;
	readonly closeButton: Locator;
	readonly applySearchButton: Locator;
	readonly resetButton: Locator;
	readonly datesField: Locator;
	readonly testPathInput: Locator;
	readonly hashInput: Locator;
	readonly parametersInput: Locator;
	readonly runIdInput: Locator;
	readonly labelsInput: Locator;
	readonly branchesInput: Locator;
	readonly revisionsInput: Locator;
	readonly tagsInput: Locator;
	readonly tagsField: Locator;
	readonly verdictInput: Locator;
	readonly verdictExpressionInput: Locator;
	readonly verdictLookupGroup: Locator;

	constructor(page: Page) {
		this.page = page;
		this.root = page
			.locator('[role="dialog"]')
			.filter({ has: page.getByText('Global Search') });
		this.heading = this.root.getByText('Global Search');
		this.closeButton = this.root.getByRole('button', {
			name: 'Close',
			exact: true
		});
		this.applySearchButton = this.root.getByRole('button', {
			name: 'Apply Search'
		});
		this.resetButton = this.root.getByRole('button', {
			name: 'Reset',
			exact: true
		});
		this.datesField = this.root.getByRole('group', { name: 'Dates' });
		this.testPathInput = this.root.getByLabel('Test Path');
		this.hashInput = this.root.getByLabel('Hash');
		// Labels, Branches, Revisions, Tags and Parameters are each one field
		// that takes values and expressions alike, as chips.
		this.parametersInput = this.root.getByRole('combobox', {
			name: 'Parameters'
		});
		this.runIdInput = this.root.getByLabel('Run ID');
		this.labelsInput = this.root.getByRole('combobox', { name: 'Labels' });
		this.branchesInput = this.root.getByRole('combobox', { name: 'Branches' });
		this.revisionsInput = this.root.getByRole('combobox', {
			name: 'Revisions'
		});
		this.tagsInput = this.root.getByRole('combobox', { name: 'Tags' });
		this.tagsField = this.metaField(this.tagsInput);
		this.verdictInput = this.root.locator('input[name="verdict"]');
		this.verdictExpressionInput = this.root.getByLabel('Verdict Expression');
		this.verdictLookupGroup = this.root.getByRole('radiogroup', {
			name: 'Verdict lookup type'
		});
	}

	async expectVisible(): Promise<void> {
		await expect(this.root).toBeVisible();
		await expect(this.heading).toBeVisible();
	}

	async expectHidden(): Promise<void> {
		await expect(this.root).toBeHidden();
	}

	async close(): Promise<void> {
		await this.closeButton.click();
		await this.expectHidden();
	}

	async applySearch(): Promise<void> {
		await this.applySearchButton.scrollIntoViewIfNeeded();
		await this.applySearchButton.click();
	}

	async reset(): Promise<void> {
		await this.resetButton.click();
	}

	async submitWithKeyboard(): Promise<void> {
		await this.testPathInput.press('Control+Enter');
	}

	sectionButton(name: string): Locator {
		return this.root.getByRole('button', { name, exact: true });
	}

	async clearTestSection(): Promise<void> {
		await this.sectionButton('Clear test section').click();
	}

	async clearResultSection(): Promise<void> {
		await this.sectionButton('Clear result section').click();
	}

	async expectError(message: string): Promise<void> {
		await expect(this.root.getByText(message)).toBeVisible({
			timeout: 15_000
		});
	}

	async fillTestPath(value: string): Promise<void> {
		await this.testPathInput.click();
		await this.testPathInput.fill(value);
		const option = this.page.locator('[role="option"]').first();
		await option
			.click({ timeout: 3000 })
			.catch(() => this.testPathInput.press('Enter'));
	}

	async fillHash(value: string): Promise<void> {
		await this.hashInput.fill(value);
	}

	async fillRunId(value: string): Promise<void> {
		await this.runIdInput.fill(value);
	}

	async addParameters(values: string[]): Promise<void> {
		await this.addValueChips(this.parametersInput, values);
	}

	async addLabels(values: string[]): Promise<void> {
		await this.addValueChips(this.labelsInput, values);
	}

	async addBranches(values: string[]): Promise<void> {
		await this.addValueChips(this.branchesInput, values);
	}

	async addRevisions(values: string[]): Promise<void> {
		await this.addValueChips(this.revisionsInput, values);
	}

	async addTags(values: string[]): Promise<void> {
		await this.addValueChips(this.tagsInput, values);
	}

	async addVerdicts(values: string[]): Promise<void> {
		await this.addBadges(this.verdictInput, values);
	}

	async addParameterExpression(value: string): Promise<void> {
		await this.addExpressionChip(this.parametersInput, value);
	}

	async addLabelExpression(value: string): Promise<void> {
		await this.addExpressionChip(this.labelsInput, value);
	}

	async addBranchExpression(value: string): Promise<void> {
		await this.addExpressionChip(this.branchesInput, value);
	}

	async addRevisionExpression(value: string): Promise<void> {
		await this.addExpressionChip(this.revisionsInput, value);
	}

	async addTagExpression(value: string): Promise<void> {
		await this.addExpressionChip(this.tagsInput, value);
	}

	/** The expression chip of a run or test field, by its exact text. */
	expressionChip(input: Locator, text: string): Locator {
		return this.metaField(input).locator(
			`[data-testid="meta-filter-chip"][data-kind="expression"][data-value="${text}"]`
		);
	}

	async fillVerdictExpression(value: string): Promise<void> {
		await this.ensureExpressionFieldVisible(
			this.verdictExpressionInput,
			this.verdictInput
		);
		await this.verdictExpressionInput.fill(value);
	}

	async openDatesPicker(): Promise<void> {
		await this.datesField.getByRole('button').click();
	}

	async setVerdictLookup(mode: VerdictLookupMode): Promise<void> {
		await this.verdictLookupOption(mode).click();
	}

	async expectTagListed(text: string): Promise<void> {
		await expect(this.tagsField).toContainText(text, { timeout: 15_000 });
	}

	async expectTagNotListed(text: string): Promise<void> {
		await expect(this.tagsField).not.toContainText(text, { timeout: 15_000 });
	}

	async expectTagExpression(text: string): Promise<void> {
		await expect(this.expressionChip(this.tagsInput, text)).toBeVisible({
			timeout: 15_000
		});
	}

	async expectVerdictFieldAcceptsInput(): Promise<void> {
		await expect(this.verdictInput).toBeEnabled({ timeout: 15_000 });
	}

	async expectVerdictFieldDisabled(): Promise<void> {
		await expect(this.verdictInput).toBeDisabled({ timeout: 15_000 });
	}

	verdictLookupOption(mode: VerdictLookupMode): Locator {
		return this.verdictLookupGroup.getByRole('radio', {
			name: VERDICT_LOOKUP_LABELS[mode],
			exact: true
		});
	}

	runPropertyCheckbox(label: string): Locator {
		return this.root.getByRole('checkbox', { name: label, exact: true });
	}

	resultClassificationCheckbox(label: string): Locator {
		return this.root.getByRole('checkbox', { name: label, exact: true });
	}

	/** The Classification section's Untriaged / Triaged boxes. */
	triageCheckbox(label: 'Untriaged' | 'Triaged'): Locator {
		return this.resultClassificationCheckbox(label);
	}

	/** The Classification section's category boxes, by badge label (Known, Env, …). */
	categoryCheckbox(label: string): Locator {
		return this.resultClassificationCheckbox(label);
	}

	get issuePicker(): Locator {
		return this.root.getByTestId('issue-picker-input');
	}

	async pickIssue(title: string): Promise<void> {
		await pickIssueOption(
			this.page,
			this.issuePicker.locator('xpath=ancestor::div[2]'),
			title
		);
	}

	obtainedResultCheckbox(label: string): Locator {
		return this.root.getByRole('checkbox', { name: label, exact: true });
	}

	private async addBadges(input: Locator, values: string[]): Promise<void> {
		for (const value of values) {
			await input.fill(value);
			await input.press('Enter');
		}
	}

	/** The combined fields take only listed values, so Enter waits for the list. */
	private async addValueChips(input: Locator, values: string[]): Promise<void> {
		for (const value of values) {
			await input.fill(value);
			await expect(this.page.getByRole('option').first()).toBeVisible();
			await input.press('Enter');
		}
	}

	/** The whole field around one of the combined inputs: its chips and its mode switch. */
	private metaField(input: Locator): Locator {
		// `filter({ has })` would query `input`, rooted at the dialog, inside
		// the field and never match; the field is the input's ancestor.
		return input.locator(
			'xpath=ancestor::*[@data-testid="meta-filter-input"][1]'
		);
	}

	/**
	 * Adds `value` as one expression chip. A bare name is a value until the
	 * mode is switched, so the switch is clicked before Enter commits it.
	 */
	private async addExpressionChip(
		input: Locator,
		value: string
	): Promise<void> {
		await input.click();
		await input.fill(value);
		await this.metaField(input)
			.getByRole('radio', { name: 'Expression', exact: true })
			.click();
		await input.press('Enter');
		await expect(this.expressionChip(input, value)).toBeVisible();
		await expect(input).toHaveValue('');
	}

	private async ensureExpressionFieldVisible(
		field: Locator,
		anchorInput: Locator
	): Promise<void> {
		if (await field.isVisible()) {
			return;
		}

		await this.expressionToggleFor(anchorInput).click();
		await expect(field).toBeVisible();
	}

	private expressionToggleFor(anchorInput: Locator): Locator {
		return anchorInput.locator(
			'xpath=ancestor::div[contains(@class,"flex-1")]/following-sibling::button[1]'
		);
	}
}

export { HistoryGlobalSearchForm };
export type { VerdictLookupMode };
