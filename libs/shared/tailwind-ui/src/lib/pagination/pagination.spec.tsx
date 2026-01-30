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
});
