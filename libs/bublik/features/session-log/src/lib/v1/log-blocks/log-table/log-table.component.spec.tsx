/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { LogPagination } from './log-table.component';

describe('LogPagination', () => {
	test('provides a page-one fallback when all-pages count is unavailable', () => {
		const onPageClick = vi.fn();

		render(
			<LogPagination
				id="log-block"
				pageIndex={-1}
				totalCount={0}
				onPageClick={onPageClick}
			/>
		);

		fireEvent.click(screen.getByRole('button', { name: 'Page 1' }));

		expect(onPageClick).toHaveBeenCalledWith('log-block', 1);
		expect(screen.getByRole('button', { name: 'All pages' })).toBeTruthy();
	});

	test('does not highlight a numbered page in all-pages mode', () => {
		render(
			<LogPagination
				id="log-block"
				pageIndex={-1}
				totalCount={3}
				pageSize={1}
				currentPage={1}
				disablePageSizeSelect
			/>
		);

		expect(
			screen.getByRole('button', { name: '1' }).getAttribute('aria-current')
		).toBeNull();
		expect(
			screen
				.getByRole('button', { name: 'All pages' })
				.getAttribute('aria-pressed')
		).toBe('true');
	});
});
