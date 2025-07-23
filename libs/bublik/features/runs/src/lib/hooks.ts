/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { sub } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { OnChangeFn, PaginationState } from '@tanstack/react-table';

import { RunsAPIQuery } from '@/shared/types';
import { formatTimeToAPI, parseISODuration } from '@/shared/utils';
import { useProjectSearch } from '@/bublik/features/projects';

import {
	addToSelection,
	resetSelection,
	updateGlobalFilter,
	removeFromSelection
} from './runs-slice';
import {
	selectGlobalFilter,
	selectCompareIds,
	selectRowSelection
} from './runs-slice.selectors';

export const useRunsGlobalFilter = () => {
	const dispatch = useDispatch();
	const localGlobalFilter = useSelector(selectGlobalFilter);

	const handleGlobalFilterChange: OnChangeFn<string[]> = useCallback(
		(updater) => {
			if (typeof updater === 'function') {
				dispatch(updateGlobalFilter(updater(localGlobalFilter)));
			} else {
				dispatch(updateGlobalFilter(updater));
			}
		},
		[dispatch, localGlobalFilter]
	);

	return { localGlobalFilter, handleGlobalFilterChange };
};

export const useRunsPagination = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const pagination = useMemo<PaginationState>(() => {
		return {
			pageIndex: Number(searchParams.get('page') || 1) - 1,
			pageSize: Number(searchParams.get('pageSize') || 25)
		};
	}, [searchParams]);

	const handlePaginationChange: OnChangeFn<PaginationState> = useCallback(
		(updater) => {
			const newSearchParams = new URLSearchParams(searchParams);

			if (typeof updater === 'function') {
				const newPagination = updater(pagination);

				newSearchParams.set('page', (newPagination.pageIndex + 1).toString());
				newSearchParams.set('pageSize', newPagination.pageSize.toString());

				setSearchParams(newSearchParams);
			} else {
				newSearchParams.set('page', (updater.pageIndex + 1).toString());
				newSearchParams.set('pageSize', updater.pageSize.toString());

				setSearchParams(newSearchParams);
			}

			document
				.getElementById('page-container')
				?.scrollTo({ top: 0, behavior: 'smooth' });
		},
		[pagination, searchParams, setSearchParams]
	);

	return { pagination, handlePaginationChange };
};

export const useRunsQuery = () => {
	const [searchParams] = useSearchParams();
	const { pagination } = useRunsPagination();
	const { projectIds } = useProjectSearch();

	const dates = useMemo(() => {
		const calendarMode = searchParams.get('calendarMode');
		const searchDuration = searchParams.get('duration');

		if (calendarMode === 'duration' && searchDuration) {
			try {
				const duration = parseISODuration(searchDuration);
				const endDate = new Date();
				const startDate = sub(endDate, duration);

				return {
					startDate: formatTimeToAPI(startDate),
					finishDate: formatTimeToAPI(endDate)
				};
			} catch (_: unknown) {
				return { startDate: '', finishDate: '' };
			}
		}

		return {
			startDate: searchParams.get('startDate') || '',
			finishDate: searchParams.get('finishDate') || ''
		};
	}, [searchParams]);

	const query = useMemo<RunsAPIQuery>(
		() => ({
			startDate: dates.startDate,
			finishDate: dates.finishDate,
			page: (pagination.pageIndex + 1).toString() || '1',
			pageSize: pagination.pageSize.toString() || '25',
			runData: searchParams.get('runData') || '',
			tagExpr: searchParams.get('tagExpr') || '',
			projects: projectIds
		}),
		[
			dates.finishDate,
			dates.startDate,
			pagination.pageIndex,
			pagination.pageSize,
			projectIds,
			searchParams
		]
	);

	return { query };
};

export const useRunsSelection = () => {
	const dispatch = useDispatch();
	const compareIds = useSelector(selectCompareIds);
	const rowSelection = useSelector(selectRowSelection);

	const resetSelect = useCallback(() => dispatch(resetSelection()), [dispatch]);

	const removeSelection = useCallback(
		(runId: string) => dispatch(removeFromSelection(runId)),
		[dispatch]
	);

	const addSelection = useCallback(
		(runId: string) => dispatch(addToSelection(runId)),
		[dispatch]
	);

	return {
		rowSelection,
		compareIds,
		resetSelection,
		resetSelect,
		removeSelection,
		addSelection
	};
};
