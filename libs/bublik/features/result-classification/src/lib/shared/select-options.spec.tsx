/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
	CATEGORY_SELECT_OPTIONS,
	EXPECTED_SELECT_OPTIONS,
	ISSUE_STATE_SELECT_OPTIONS,
	RULE_ACTIVE_SELECT_OPTIONS,
	SelectedOptionHint
} from './select-options';

describe('select options', () => {
	it('offers the six categories under their table labels', () => {
		expect(
			CATEGORY_SELECT_OPTIONS.map((option) => option.displayValue)
		).toEqual(['Defect', 'Test Bug', 'Env', 'Known', 'Flaky', 'Investigate']);
	});

	it('calls the no-disposition choice "Marked", as the badge does', () => {
		expect(
			EXPECTED_SELECT_OPTIONS.find((option) => option.value === 'none')
				?.displayValue
		).toBe('Marked');
	});

	it('maps rule state to the form values', () => {
		expect(RULE_ACTIVE_SELECT_OPTIONS.map((option) => option.value)).toEqual([
			'active',
			'inactive'
		]);
	});

	it('offers the two issue states under their badge labels', () => {
		expect(
			ISSUE_STATE_SELECT_OPTIONS.map((option) => [
				option.value,
				option.displayValue
			])
		).toEqual([
			['open', 'Open'],
			['closed', 'Closed']
		]);
	});
});

describe('SelectedOptionHint', () => {
	it('explains the picked category', () => {
		render(
			<SelectedOptionHint
				options={CATEGORY_SELECT_OPTIONS}
				value="product-defect"
			/>
		);

		expect(
			screen.getByText(
				'A real defect in the product under test. Counts as unexpected.'
			)
		).toBeInTheDocument();
	});

	it('explains a closed issue state', () => {
		render(
			<SelectedOptionHint options={ISSUE_STATE_SELECT_OPTIONS} value="closed" />
		);

		expect(
			screen.getByText('Its rules are off, and their failures count again.')
		).toBeInTheDocument();
	});

	it('shows nothing while no value is picked', () => {
		const { container } = render(
			<SelectedOptionHint options={CATEGORY_SELECT_OPTIONS} value="" />
		);

		expect(container).toBeEmptyDOMElement();
	});
});
