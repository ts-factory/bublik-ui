/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { it, describe, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Pagination, PaginationProps } from './pagination';
const getPaginationProps = (): PaginationProps => {
	return { totalCount: 1000 };
};
describe('components/Pagination', () => {
	it('should render successfully', () => {
		const { getByTestId } = render(<Pagination {...getPaginationProps()} />);
		const badge = getByTestId('tw-pagination');
		expect(badge).toBeVisible();
	});

	it('can render navigation without an active numbered page', () => {
		const { getByRole } = render(
			<Pagination
				totalCount={3}
				pageSize={1}
				currentPage={1}
				showCurrentPage={false}
			/>
		);

		expect(getByRole('button', { name: '1' })).not.toHaveAttribute(
			'aria-current'
		);
	});
});
