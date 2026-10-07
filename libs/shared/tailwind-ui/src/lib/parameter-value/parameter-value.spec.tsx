/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

import { ParameterValue } from './parameter-value';

const ENV_VALUE = '{ addr 10.0.0.1, port 8080, proto tcp }';

describe('components/ParameterValue', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should toggle a pre block from a focusable label button', () => {
		const onClick = vi.fn();
		const { getByRole } = render(
			<ParameterValue
				name="env"
				value={ENV_VALUE}
				mode="pre"
				isSelected
				onClick={onClick}
			/>
		);

		const button = getByRole('button', { name: 'env:' });
		expect(button).toHaveAttribute('aria-pressed', 'true');

		fireEvent.click(button);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('should render the label as text when the block is not clickable', () => {
		const { queryByRole, getByText } = render(
			<ParameterValue name="env" value={ENV_VALUE} mode="pre" />
		);

		expect(queryByRole('button', { name: 'env:' })).not.toBeInTheDocument();
		expect(getByText('env:')).toBeInTheDocument();
	});

	it('should not toggle when the click ends a text selection in the block', () => {
		const onClick = vi.fn();
		const { getByTestId } = render(
			<ParameterValue
				name="env"
				value={ENV_VALUE}
				mode="pre"
				onClick={onClick}
			/>
		);
		const block = getByTestId('tw-parameter-block');
		const pre = block.querySelector('pre');

		vi.spyOn(window, 'getSelection').mockReturnValue({
			isCollapsed: false,
			anchorNode: pre?.firstChild ?? null
		} as Selection);
		fireEvent.click(block);
		expect(onClick).not.toHaveBeenCalled();

		vi.restoreAllMocks();
		fireEvent.click(block);
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
