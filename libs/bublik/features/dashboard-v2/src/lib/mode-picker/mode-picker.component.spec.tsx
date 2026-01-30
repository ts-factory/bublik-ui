/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { describe, it, expect, vi } from 'vitest';
import {
	RenderOptions,
	render as tsRender,
	screen
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DASHBOARD_MODE } from '@/shared/types';
import { TooltipProvider } from '@/shared/tailwind-ui';
import { ModePicker } from './mode-picker.component';
import { PropsWithChildren, ReactElement } from 'react';
const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
	tsRender(ui, {
		wrapper: (props: PropsWithChildren) => (
			<TooltipProvider>{props.children}</TooltipProvider>
		),
		...options
	});
describe('ModePicker', () => {
	it('matches snapshot', () => {
		const { asFragment } = render(<ModePicker type="single" />);
		expect(asFragment()).toMatchSnapshot();
	});
	it('should highlight clicked item', async () => {
		const { asFragment } = render(<ModePicker type="single" />);
		const modeRowsLine = screen.getByLabelText('Mode rows line');
		await userEvent.click(modeRowsLine);
		expect(asFragment()).toMatchSnapshot();
	});
	it('renders mode options', () => {
		render(<ModePicker type="single" />);
		expect(screen.getByLabelText('Mode rows')).toBeInTheDocument();
		expect(screen.getByLabelText('Mode rows line')).toBeInTheDocument();
		expect(screen.getByLabelText('Mode columns')).toBeInTheDocument();
	});
	it('handles toggle events', async () => {
		const handleChange = vi.fn();
		render(<ModePicker type="single" onValueChange={handleChange} />);
		const modeRows = screen.getByLabelText('Mode rows');
		const modeRowsLine = screen.getByLabelText('Mode rows line');
		const modeColumns = screen.getByLabelText('Mode columns');
		await userEvent.click(modeRows);
		await userEvent.click(modeRowsLine);
		await userEvent.click(modeColumns);
		expect(handleChange).toHaveBeenCalledWith(DASHBOARD_MODE.Rows);
		expect(handleChange).toHaveBeenCalledWith(DASHBOARD_MODE.RowsLine);
		expect(handleChange).toHaveBeenCalledWith(DASHBOARD_MODE.Columns);
	});
});
