/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TooltipProvider } from '@/shared/tailwind-ui';

import { CategoryPresetButtons } from './category-preset-buttons.component';

// Icons do not resolve under vitest: the buttons draw one each, and
// `SortArrow` is read at import time by the tailwind-ui barrel.
vi.mock('@/icons', () => {
	const icon = (name: string) => (props: Record<string, unknown>) =>
		<svg data-icon={name} {...props} />;

	return {
		SortArrow: icon('SortArrow'),
		TriangleExclamationMark: icon('TriangleExclamationMark'),
		InformationCircleCheckmark: icon('InformationCircleCheckmark')
	};
});

function setup(
	value: readonly string[],
	availableCategories?: readonly string[]
) {
	const onChange = vi.fn();

	render(
		<TooltipProvider>
			<CategoryPresetButtons
				value={value}
				onChange={onChange}
				testIdPrefix="issues"
				availableCategories={availableCategories}
			/>
		</TooltipProvider>
	);

	return {
		onChange,
		attention: screen.getByTestId('issues-preset-attention'),
		explained: screen.getByTestId('issues-preset-explained')
	};
}

describe('CategoryPresetButtons', () => {
	it('starts with both presets released', () => {
		const { attention, explained } = setup([]);

		expect(attention).toHaveAttribute('aria-pressed', 'false');
		expect(attention).toHaveTextContent('Actionable');
		expect(explained).toHaveAttribute('aria-pressed', 'false');
		expect(explained).toHaveTextContent('Triaged');
	});

	it('sets the filter to the preset categories on click', async () => {
		const { attention, onChange } = setup([]);

		await userEvent.click(attention);

		expect(onChange).toHaveBeenCalledWith([
			'to-investigate',
			'product-defect',
			'test-bug'
		]);
	});

	it('is pressed when the filter is the preset in any order, and clears on click', async () => {
		const { attention, explained, onChange } = setup([
			'test-bug',
			'to-investigate',
			'product-defect'
		]);

		expect(attention).toHaveAttribute('aria-pressed', 'true');
		expect(explained).toHaveAttribute('aria-pressed', 'false');

		await userEvent.click(attention);

		expect(onChange).toHaveBeenCalledWith(undefined);
	});

	it('stays released on a partial selection and replaces it on click', async () => {
		const { attention, explained, onChange } = setup(['env', 'flaky']);

		expect(attention).toHaveAttribute('aria-pressed', 'false');
		expect(explained).toHaveAttribute('aria-pressed', 'false');

		await userEvent.click(explained);

		expect(onChange).toHaveBeenCalledWith(['env', 'flaky', 'known-issue']);
	});

	it('is enabled whatever the filter when the listed categories are unknown', () => {
		const { attention, explained } = setup([]);

		expect(attention).toBeEnabled();
		expect(explained).toBeEnabled();
	});

	it('disables a preset none of whose categories is listed', async () => {
		const { attention, explained, onChange } = setup([], ['known-issue']);

		expect(explained).toBeEnabled();
		expect(attention).toBeDisabled();

		await userEvent.click(attention);

		expect(onChange).not.toHaveBeenCalled();
	});

	it('disables both presets when nothing listed is categorised', () => {
		const { attention, explained } = setup([], []);

		expect(attention).toBeDisabled();
		expect(explained).toBeDisabled();
	});

	it('keeps a pressed preset enabled so it can be cleared', async () => {
		const { attention, explained, onChange } = setup(
			['to-investigate', 'product-defect', 'test-bug'],
			[]
		);

		expect(attention).toBeEnabled();
		expect(explained).toBeDisabled();

		await userEvent.click(attention);

		expect(onChange).toHaveBeenCalledWith(undefined);
	});
});
