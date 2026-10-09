/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { OnChangeFn, PaginationState } from '@tanstack/react-table';

import { isFunction } from '@/shared/utils';

import { useHistorySearch } from './use-history-search';
import { useHistorySearchNavigate } from './use-history-search-navigate';

/**
 * The results table's page, as `page`/`pageSize` (1-based, strings). A page
 * change pushes a history entry, so the browser's back button pages back;
 * the hash and `location.state` are dropped, as `setSearchParams` did.
 */
export const useHistoryPagination = () => {
	const page = useHistorySearch((search) => search.page);
	const pageSize = useHistorySearch((search) => search.pageSize);
	const navigateSearch = useHistorySearchNavigate();

	const pagination = useMemo<PaginationState>(
		() => ({
			pageIndex: Number(page || 1) - 1,
			pageSize: Number(pageSize) || 25
		}),
		[page, pageSize]
	);

	const handlePaginationChange: OnChangeFn<PaginationState> = useCallback(
		(updaterOrValue) => {
			const next = isFunction(updaterOrValue)
				? updaterOrValue(pagination)
				: updaterOrValue;

			navigateSearch({
				page: String(next.pageIndex + 1),
				pageSize: String(next.pageSize)
			});

			document
				.getElementById('page-container')
				?.scrollTo({ top: 0, behavior: 'smooth' });
		},
		[pagination, navigateSearch]
	);
	return { pagination, handlePaginationChange };
};
