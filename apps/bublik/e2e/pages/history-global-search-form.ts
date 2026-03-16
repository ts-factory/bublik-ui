/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { expect, Locator, Page } from '@playwright/test';

type VerdictLookupMode = 'String' | 'Regex' | 'None';

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
	readonly parameterExpressionInput: Locator;
	readonly runIdInput: Locator;
	readonly labelsInput: Locator;
	readonly labelExpressionInput: Locator;
	readonly branchesInput: Locator;
	readonly branchExpressionInput: Locator;
	readonly revisionsInput: Locator;
	readonly revisionExpressionInput: Locator;
	readonly tagsInput: Locator;
	readonly tagExpressionInput: Locator;
	readonly verdictInput: Locator;
	readonly verdictExpressionInput: Locator;
	readonly verdictLookupGroup: Locator;

	constructor(page: Page) {
		this.page = page;
		this.root = page
			.locator('[role="dialog"]')
			.filter({ has: page.getByText('Global Search') });
		this.heading = this.root.getByText('Global Search');
		this.closeButton = this.heading.locator(
			'xpath=ancestor::div[contains(@class,"flex-col")]/following-sibling::button[1]'
		);
		this.applySearchButton = this.root.getByRole('button', {
			name: 'Apply Search'
		});
		this.resetButton = this.root.getByRole('button', { name: 'Reset' });
		this.datesField = this.root.getByRole('group', { name: 'Dates' });
		this.testPathInput = this.root.getByLabel('Test Path');
		this.hashInput = this.root.getByLabel('Hash');
		this.parametersInput = this.root.getByPlaceholder('time_limit:30');
		this.parameterExpressionInput = this.root.getByLabel(
			'Parameter Expression'
		);
		this.runIdInput = this.root.getByLabel('Run ID');
		this.labelsInput = this.root.getByPlaceholder('label');
		this.labelExpressionInput = this.root.getByLabel('Label Expression');
		this.branchesInput = this.root.getByPlaceholder('master');
		this.branchExpressionInput = this.root.getByLabel('Branch Expression');
		this.revisionsInput = this.root.getByPlaceholder(
			'8af383125f20cc5ecdb8393bf'
		);
		this.revisionExpressionInput = this.root.getByLabel('Revision Expression');
		this.tagsInput = this.root.getByPlaceholder('medford');
		this.tagExpressionInput = this.root.getByLabel('Tag Expression');
		this.verdictInput = this.root.getByPlaceholder(
			'Unexpectedly failed with errno ENOPROTOOPT'
		);
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
		await this.addBadges(this.parametersInput, values);
	}

	async addLabels(values: string[]): Promise<void> {
		await this.addBadges(this.labelsInput, values);
	}

	async addBranches(values: string[]): Promise<void> {
		await this.addBadges(this.branchesInput, values);
	}

	async addRevisions(values: string[]): Promise<void> {
		await this.addBadges(this.revisionsInput, values);
	}

	async addTags(values: string[]): Promise<void> {
		await this.addBadges(this.tagsInput, values);
	}

	async addVerdicts(values: string[]): Promise<void> {
		await this.addBadges(this.verdictInput, values);
	}

	async fillParameterExpression(value: string): Promise<void> {
		await this.ensureExpressionFieldVisible(
			this.parameterExpressionInput,
			this.parametersInput
		);
		await this.parameterExpressionInput.fill(value);
	}

	async fillLabelExpression(value: string): Promise<void> {
		await this.ensureExpressionFieldVisible(
			this.labelExpressionInput,
			this.labelsInput
		);
		await this.labelExpressionInput.fill(value);
	}

	async fillBranchExpression(value: string): Promise<void> {
		await this.ensureExpressionFieldVisible(
			this.branchExpressionInput,
			this.branchesInput
		);
		await this.branchExpressionInput.fill(value);
	}

	async fillRevisionExpression(value: string): Promise<void> {
		await this.ensureExpressionFieldVisible(
			this.revisionExpressionInput,
			this.revisionsInput
		);
		await this.revisionExpressionInput.fill(value);
	}

	async fillTagExpression(value: string): Promise<void> {
		await this.ensureExpressionFieldVisible(
			this.tagExpressionInput,
			this.tagsInput
		);
		await this.tagExpressionInput.fill(value);
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
		await this.verdictLookupGroup
			.getByRole('radio', { name: new RegExp(mode, 'i') })
			.click();
	}

	runPropertyCheckbox(label: string): Locator {
		return this.root.getByRole('checkbox', { name: label, exact: true });
	}

	resultClassificationCheckbox(label: string): Locator {
		return this.root.getByRole('checkbox', { name: label, exact: true });
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
