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

	it('should hide itself below two pages', () => {
		const { queryByTestId } = render(
			<Pagination totalCount={4} pageSize={25} currentPage={1} />
		);

		expect(queryByTestId('tw-pagination')).not.toBeInTheDocument();
	});

	// Every table footer passes `ml-auto`. Spread through `restProps` it replaced
	// the wrapper's own `flex`, and since the buttons are `display: flex` they
	// went block-level and stacked into a column.
	it('should merge a caller className instead of replacing its own', () => {
		const { getByTestId } = render(
			<Pagination {...getPaginationProps()} className="ml-auto" />
		);

		const wrapper = getByTestId('tw-pagination');

		expect(wrapper).toHaveClass('ml-auto');
		expect(wrapper).toHaveClass('flex');
	});

	// The table footers pair this bar with a row count, so an empty footer reads
	// as broken — `compact` stays mounted where every other variant bails. What
	// it must not do is offer navigation: a disabled Previous, a `Page 1 of 1`
	// and a disabled Next are three controls that can never do anything. The
	// page-size select is the one thing still worth having, so it is what stays.
	it('should keep the page size but drop navigation at a single page when compact', () => {
		const { getByTestId, queryByRole } = render(
			<Pagination
				variant="compact"
				totalCount={4}
				pageSize={25}
				currentPage={1}
			/>
		);

		expect(getByTestId('tw-pagination')).toBeVisible();
		expect(queryByRole('button', { name: '‹' })).not.toBeInTheDocument();
		expect(queryByRole('button', { name: '›' })).not.toBeInTheDocument();
	});
});
