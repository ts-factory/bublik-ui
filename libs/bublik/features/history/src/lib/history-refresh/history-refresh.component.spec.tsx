/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { vi, expect, describe } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

import { HistoryRefresh } from './history-refresh.component';

describe('HistoryRefresh', () => {
	it('should render the component correctly', () => {
		const { asFragment } = render(<HistoryRefresh />);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should call the onRefreshClick function when the button is clicked', () => {
		const onRefreshClick = vi.fn();
		const { getByRole } = render(
			<HistoryRefresh onRefreshClick={onRefreshClick} />
		);

		fireEvent.click(getByRole('button'));

		expect(onRefreshClick).toHaveBeenCalled();
	});
});
