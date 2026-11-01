/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { TooltipProvider } from '@/shared/tailwind-ui';

import type { SelectableResult } from './result-selection.utils';

// Icons do not resolve under vitest; `SortArrow` is read at import time by
// the tailwind-ui barrel.
vi.mock('@/icons', () => {
	const icon = (name: string) => (props: Record<string, unknown>) =>
		<svg data-icon={name} {...props} />;

	return {
		BoxCheckmark: icon('BoxCheckmark'),
		SortArrow: icon('SortArrow')
	};
});

const { SelectListedResults } = await import(
	'./select-listed-results.component'
);

function result(
	resultId: number,
	overrides: Partial<SelectableResult> = {}
): SelectableResult {
	return { result_id: resultId, run_id: 1, has_error: true, ...overrides };
}

function renderButton(listed: SelectableResult[], picked: number[] = []) {
	const selection = {
		isSelected: (resultId: number) => picked.includes(resultId),
		select: vi.fn(),
		deselect: vi.fn()
	};

	render(
		<TooltipProvider>
			<SelectListedResults selection={selection} listed={listed} />
		</TooltipProvider>
	);

	return {
		selection,
		button: screen.getByRole('button', { name: /Select All/ })
	};
}

describe('SelectListedResults', () => {
	it('picks the listed failures, leaving plain passes out', () => {
		const failing = result(1);
		const pass = result(2, { has_error: false });
		const { selection, button } = renderButton([failing, pass]);

		fireEvent.click(button);

		expect(selection.select).toHaveBeenCalledWith([failing]);
		expect(button.getAttribute('aria-pressed')).toBe('false');
	});

	it('picks a classified result even when it is expected', () => {
		const classified = result(3, {
			has_error: false,
			issues: [{ expected: true, issue_state: 'open' }]
		});
		const { selection, button } = renderButton([classified]);

		fireEvent.click(button);

		expect(selection.select).toHaveBeenCalledWith([classified]);
	});

	it('is pressed while every listed failure is picked, and drops them', () => {
		const { selection, button } = renderButton(
			[result(4), result(5), result(6, { has_error: false })],
			[4, 5]
		);

		expect(button.getAttribute('aria-pressed')).toBe('true');
		fireEvent.click(button);

		expect(selection.deselect).toHaveBeenCalledWith([4, 5]);
		expect(selection.select).not.toHaveBeenCalled();
	});

	it('is disabled when nothing listed can be classified', () => {
		const { button } = renderButton([result(7, { has_error: false })]);

		expect(button).toHaveProperty('disabled', true);
	});
});
