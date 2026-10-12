/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useCallback } from 'react';
import { getRouteApi } from '@tanstack/react-router';
import type {
	ExpandedState,
	OnChangeFn,
	PaginationState
} from '@tanstack/react-table';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { useSearchWriter } from '@/router';
import type { ImportTaskFilters } from '@/shared/types';
import { importSearch, type ImportSearch } from '@/shared/utils';

/**
 * `/admin/import`'s search as its route schema (`importSearch`)
 * types it: the filter form, the pagination and the expanded rows as JSON,
 * the open task log and whether it polls.
 */
type ImportPageSearch = ImportSearch;

const importRoute = getRouteApi('/_app/admin/import');

/** The schema's read-time defaults; no row expanded is what react-table reads an absent `expanded` as. */
const {
	filters: DEFAULT_FILTERS,
	pagination: DEFAULT_PAGINATION,
	expanded: NO_EXPANDED_ROWS
} = importSearch.withDefaults({}) as Required<
	Pick<ImportSearch, 'filters' | 'pagination' | 'expanded'>
>;

interface ImportSearchState {
	filters: ImportTaskFilters;
	pagination: PaginationState;
	expanded: ExpandedState;
	taskId: string | undefined;
	poll: boolean;
}

/**
 * The page's search with its defaults: a key that is absent or not JSON (or
 * the JSON `null`) reads as the default, as `withDefault` read it. The
 * router shares structure, so an unchanged value keeps its identity.
 */
function useImportSearch(): ImportSearchState {
	return importRoute.useSearch({
		select: (search) => ({
			filters: search.filters ?? DEFAULT_FILTERS,
			pagination: search.pagination ?? DEFAULT_PAGINATION,
			expanded: search.expanded ?? NO_EXPANDED_ROWS,
			taskId: search.taskId,
			poll: search.poll ?? false
		})
	});
}

/**
 * Writes import search keys the way use-query-params' `replaceIn` did: on
 * the search the router holds right now (a write earlier in the same handler
 * included), merged, replacing the entry, `location.state` kept, the hash
 * dropped and the window scroll left alone. `undefined`
 * removes a key; typed values are serialized by the route's codecs.
 */
function useImportSearchWriter(): (
	update: (latest: ImportPageSearch) => ImportPageSearch
) => void {
	const writeSearch = useSearchWriter();

	return useCallback(
		(update) => writeSearch((latest) => update(latest as ImportPageSearch)),
		[writeSearch]
	);
}

const resetPagination = (value: PaginationState): PaginationState => ({
	...value,
	pageIndex: 0
});

/** The filter form and the pagination; a filter change goes back to the first page. */
function useImportEventQueryParams() {
	const { filters, pagination } = useImportSearch();
	const writeSearch = useImportSearchWriter();

	const setPagination: OnChangeFn<PaginationState> = (updater) => {
		writeSearch((latest) => {
			const latestPagination = latest.pagination ?? DEFAULT_PAGINATION;

			return {
				pagination:
					typeof updater === 'function' ? updater(latestPagination) : updater
			};
		});
	};

	const handleFilterChange = (values: ImportTaskFilters) => {
		trackEvent(analyticsEventNames.importEventsFilterApply, {
			hasUrl: Boolean(values.url),
			hasCeleryTask: Boolean(values.celery_task),
			hasJob: Boolean(values.job),
			hasRun: Boolean(values.run),
			hasStatus: Boolean(values.status)
		});

		writeSearch((latest) => ({
			filters: values,
			pagination: resetPagination(latest.pagination ?? DEFAULT_PAGINATION)
		}));
	};

	const handleResetClick = () => {
		trackEvent(analyticsEventNames.importEventsFilterReset, {
			source: 'import_page'
		});

		writeSearch((latest) => ({
			filters: DEFAULT_FILTERS,
			pagination: resetPagination(latest.pagination ?? DEFAULT_PAGINATION)
		}));
	};

	return {
		query: filters,
		setQuery: handleFilterChange,
		onResetClick: handleResetClick,
		pagination,
		setPagination
	};
}

/** The rows of the event table whose details are open. */
function useImportLogExpanded() {
	const { expanded } = useImportSearch();
	const writeSearch = useImportSearchWriter();

	// The updater gets the latest value as `JsonParam` decoded it, absent
	// included: react-table's row toggle spreads it, so `undefined` is fine.
	const setExpanded: OnChangeFn<ExpandedState> = useCallback(
		(updater) =>
			writeSearch((latest) => ({
				expanded:
					typeof updater === 'function'
						? updater(latest.expanded as ExpandedState)
						: updater
			})),
		[writeSearch]
	);

	return { expanded, setExpanded };
}

/**
 * The task log drawer: `taskId` opens it and `poll` keeps it refetching.
 * A toggle opens `task` (or closes the open one) and sets `poll` when given;
 * closing drops both, so a closed drawer never keeps polling.
 */
function useImportTaskLogSearch() {
	const { taskId, poll } = useImportSearch();
	const writeSearch = useImportSearchWriter();

	const toggle = useCallback(
		(task: string, enablePolling?: boolean) => {
			trackEvent(analyticsEventNames.importTaskLogOpen, {
				action: taskId ? 'close' : 'open',
				hasTaskId: Boolean(task)
			});

			// One write for what were two `replaceIn`s (`taskId`, then `poll`).
			writeSearch((latest) => ({
				taskId: latest.taskId ? undefined : task,
				...(typeof enablePolling !== 'undefined' && { poll: enablePolling })
			}));
		},
		[taskId, writeSearch]
	);

	const close = useCallback(
		() => writeSearch(() => ({ taskId: undefined, poll: undefined })),
		[writeSearch]
	);

	return { taskId, enablePolling: poll, toggle, close };
}

export {
	DEFAULT_FILTERS,
	DEFAULT_PAGINATION,
	useImportEventQueryParams,
	useImportLogExpanded,
	useImportSearch,
	useImportSearchWriter,
	useImportTaskLogSearch
};
export type { ImportPageSearch, ImportSearchState };
