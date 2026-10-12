/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useCallback, useMemo } from 'react';
import { sub } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { OnChangeFn, PaginationState } from '@tanstack/react-table';
import { useRouter, type AnyRouter } from '@tanstack/react-router';

import {
	currentLocation,
	useRenderedLocation,
	useSearchWriter,
	writeSearch
} from '@/router';

import { RunsAPIQuery } from '@/shared/types';
import { config } from '@/bublik/config';
import { resetSelectionPopoverOpenState } from '@/shared/tailwind-ui';
import { formatTimeToAPI, parseISODuration } from '@/shared/utils';
import { useProjectSearch } from '@/bublik/features/projects';
import {
	RUNS_SIDEBAR_KEYS,
	getSidebarStateStringArray,
	setSidebarStateValue,
	useSidebarStateWriter
} from '@/bublik/features/sidebar';

import { updateGlobalFilter } from './runs-slice';
import { selectGlobalFilter } from './runs-slice.selectors';
import { normalizeRunDataQuery } from './runs-key-value';
import { runsRoute } from './runs-search';
import type { RunsFormValues } from './runs-form/runs-form.component';
import { runDataSearch, runsSearchFromForm } from './runs-form/runs-form.utils';
import { RUNS_SELECTION_POPOVER_STORAGE_KEY } from './selection-popover/selection-popover.constants';

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

/**
 * The runs table pager: 1-based `page` and `pageSize` on the
 * URL, written together as a push from all the current keys.
 */
export const useRunsPagination = () => {
	const page = runsRoute.useSearch({ select: (search) => search.page });
	const pageSize = runsRoute.useSearch({ select: (search) => search.pageSize });
	const writeSearch = useSearchWriter();

	const pagination = useMemo<PaginationState>(() => {
		return {
			pageIndex: Number(page || 1) - 1,
			pageSize: Number(pageSize || 25)
		};
	}, [page, pageSize]);

	const handlePaginationChange: OnChangeFn<PaginationState> = useCallback(
		(updater) => {
			const newPagination =
				typeof updater === 'function' ? updater(pagination) : updater;

			writeSearch(
				{
					page: (newPagination.pageIndex + 1).toString(),
					pageSize: newPagination.pageSize.toString()
				},
				{ replace: false }
			);

			document
				.getElementById('page-container')
				?.scrollTo({ top: 0, behavior: 'smooth' });
		},
		[pagination, writeSearch]
	);

	return { pagination, handlePaginationChange };
};

/**
 * Applies a run data filter (a badge click) over all the current keys and
 * replaces the entry: the list sorted and deduplicated, back on page 1.
 */
export const useRunDataWriter = () => {
	const writeSearch = useSearchWriter();

	return useCallback(
		(runData: string[]) => writeSearch(runDataSearch(runData)),
		[writeSearch]
	);
};

/**
 * Writes the form's filters over all the current `/runs` keys and replaces
 * the entry, as a submit and a reset always did: the hash is
 * dropped, the sidebar state, `hide-sidebar` and the projects are kept.
 */
export const useRunsFormWriter = () => {
	const router = useRouter<AnyRouter>();

	return useCallback(
		(form: RunsFormValues, options?: { dropDuration?: boolean }) => {
			const current = currentLocation(router).search as Record<string, unknown>;

			writeSearch(router, runsSearchFromForm(current, form, options), {
				merge: false
			});
		},
		[router]
	);
};

export const useRunsQuery = () => {
	const search = runsRoute.useSearch();
	const { pagination } = useRunsPagination();
	const { projectIds } = useProjectSearch();

	const dates = useMemo(() => {
		const { calendarMode, duration: searchDuration } = search;

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
			startDate: search.startDate || '',
			finishDate: search.finishDate || ''
		};
	}, [search]);

	const query = useMemo<RunsAPIQuery>(() => {
		const normalizedRunData = normalizeRunDataQuery(
			search.runData?.join(config.queryDelimiter) ?? ''
		);

		return {
			startDate: dates.startDate,
			finishDate: dates.finishDate,
			page: (pagination.pageIndex + 1).toString() || '1',
			pageSize: pagination.pageSize.toString() || '25',
			runData: normalizedRunData,
			tagExpr: search.tagExpr || '',
			projects: projectIds
		};
	}, [
		dates.finishDate,
		dates.startDate,
		pagination.pageIndex,
		pagination.pageSize,
		projectIds,
		search
	]);

	return { query };
};

/**
 * Manages run selection state using URL parameters.
 * Selected run IDs are stored in compressed sidebar state (`_s`), written
 * with the shared sidebar-state writer (a replace on the location the router
 * is at, its hash and state kept). Rendered by the runs list and by the runs
 * layout around `/compare` and `/multiple`.
 *
 * Read from the rendered location, as `LinkWithProject` and
 * `useNavigateWithProject` read the `_s` they carry: a match's search can
 * commit a render ahead of it, and the selection-reset redirect would then
 * carry the selection it has just cleared back to the runs list.
 */
export const useRunsSelection = () => {
	const { searchStr } = useRenderedLocation();
	const writeSidebarState = useSidebarStateWriter();

	const selectedRunIds = useMemo(
		() =>
			getSidebarStateStringArray(
				new URLSearchParams(searchStr),
				RUNS_SIDEBAR_KEYS.SELECTED
			),
		[searchStr]
	);

	const rowSelection = useMemo(() => {
		return Object.fromEntries(selectedRunIds.map((id: string) => [id, true]));
	}, [selectedRunIds]);

	const compareIds = selectedRunIds;

	const writeSelection = useCallback(
		(selection: string[] | null) =>
			writeSidebarState((sidebarState) => {
				setSidebarStateValue(
					sidebarState,
					RUNS_SIDEBAR_KEYS.SELECTED,
					selection
				);
			}),
		[writeSidebarState]
	);

	const resetSelection = useCallback(() => {
		resetSelectionPopoverOpenState(RUNS_SELECTION_POPOVER_STORAGE_KEY);
		writeSelection(null);
	}, [writeSelection]);

	const resetSelect = resetSelection;

	const removeSelection = useCallback(
		(runId: string) => {
			const newSelection = selectedRunIds.filter((id: string) => id !== runId);

			if (newSelection.length === 0) {
				resetSelectionPopoverOpenState(RUNS_SELECTION_POPOVER_STORAGE_KEY);
			}

			writeSelection(newSelection);
		},
		[selectedRunIds, writeSelection]
	);

	const addSelection = useCallback(
		(runId: string) => {
			if (selectedRunIds.includes(runId)) return;

			writeSelection([...selectedRunIds, runId]);
		},
		[selectedRunIds, writeSelection]
	);

	const replaceSelection = useCallback(
		(oldRunId: string, newRunId: string) => {
			writeSelection(
				selectedRunIds
					.filter((id: string) => id !== oldRunId && id !== newRunId)
					.concat(newRunId)
			);
		},
		[selectedRunIds, writeSelection]
	);

	return {
		rowSelection,
		compareIds,
		resetSelection,
		resetSelect,
		removeSelection,
		addSelection,
		replaceSelection
	};
};
