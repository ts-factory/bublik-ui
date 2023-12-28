/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OnChangeFn, PaginationState } from '@tanstack/react-table';

import { isFunction } from '@/shared/utils';

export const useHistoryPagination = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const pagination = useMemo<PaginationState>(
		() => ({
			pageIndex: Number(searchParams.get('page') || 1) - 1,
			pageSize: Number(searchParams.get('pageSize')) || 25
		}),
		[searchParams]
	);

	const handlePaginationChange: OnChangeFn<PaginationState> = useCallback(
		(updaterOrValue) => {
			const search = new URLSearchParams(searchParams);

			if (isFunction(updaterOrValue)) {
				const newValue = updaterOrValue(pagination);

				search.set('page', String(newValue.pageIndex + 1));
				search.set('pageSize', String(newValue.pageSize));
				setSearchParams(search);
			} else {
				search.set('page', String(updaterOrValue.pageIndex + 1));
				search.set('pageSize', String(updaterOrValue.pageSize));
				setSearchParams(search);
			}
		},
		[pagination, searchParams, setSearchParams]
	);
	return { pagination, handlePaginationChange };
};
