/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

import { HistoryEmpty } from './history-empty';

describe('HistoryEmpty', () => {
	it("should call onOpenFormClick when 'Open form' button is clicked", () => {
		const onOpenFormClick = vi.fn();

		const { getByRole } = render(
			<HistoryEmpty type="no-results" onOpenFormClick={onOpenFormClick} />
		);

		const button = getByRole('button', { name: /Open Search/i });

		fireEvent.click(button);
		expect(onOpenFormClick).toHaveBeenCalled();
	});

	it('should render no results warning', () => {
		const onOpenFormClick = vi.fn();
		const { asFragment } = render(
			<HistoryEmpty type="no-results" onOpenFormClick={onOpenFormClick} />
		);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should render no test name warning', () => {
		const { asFragment } = render(<HistoryEmpty type="no-test-name" />);

		expect(asFragment()).toMatchSnapshot();
	});

	it('should render without onOpenFormClick', () => {
		const { asFragment } = render(<HistoryEmpty type="no-results" />);

		expect(asFragment()).toMatchSnapshot();
	});
});
