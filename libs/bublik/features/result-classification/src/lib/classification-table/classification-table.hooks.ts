/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { useQueryParams, type QueryParamConfigMap } from 'use-query-params';
import type {
	ColumnFiltersState,
	OnChangeFn,
	PaginationState,
	SortingState,
	VisibilityState
} from '@tanstack/react-table';

import { useLocalStorage } from '@/shared/hooks';

import {
	DEFAULT_PAGE_SIZE,
	DELIMITER,
	KEY
} from './classification-table.constants';
import {
	FacetParam,
	PageParam,
	SearchParam,
	createPageSizeParam,
	createSortingParam,
	serializeSorting
} from './classification-table.params';
import type {
	ClassificationQueryArgs,
	ClassificationTableState,
	ClassificationTableStateConfig
} from './classification-table.types';

const EMPTY_SORTING: SortingState = [];

/**
 * Table view state, held in the URL through `use-query-params` — the same
 * mechanism the run table, the import events table and the report pages use,
 * against the `QueryParamProvider` mounted at the router root.
 *
 * The URL contract is the flat, readable one the tables have always written
 * (`?page=2&pageSize=50&sort=created:desc&state=open;closed&q=…`); the codecs
 * that produce it live in `classification-table.params.ts`, along with the two
 * rules — defaults are absent, writes merge — that make it work.
 *
 * Writes are `replaceIn`, unlike `useHistoryPagination`, which pushes. These
 * are view controls, not navigation: pushing an entry per keystroke and per
 * facet click makes the back button unusable for leaving the page.
 */
export function useClassificationTableState<F extends string>({
	filterKeys,
	searchColumnId,
	defaultPageSize = DEFAULT_PAGE_SIZE,
	defaultSorting = EMPTY_SORTING
}: ClassificationTableStateConfig<F>): ClassificationTableState {
	// `filterKeys` and `defaultSorting` are literals at every call site, so
	// identity churn would rebuild the config every render. Their serialized
	// forms are what actually matter.
	const filterKeysToken = filterKeys.join(DELIMITER);
	const defaultSortingToken = serializeSorting(defaultSorting);

	const paramConfig = useMemo<QueryParamConfigMap>(() => {
		const params: QueryParamConfigMap = {
			[KEY.PAGE]: PageParam,
			[KEY.PAGE_SIZE]: createPageSizeParam(defaultPageSize),
			[KEY.SEARCH]: SearchParam,
			[KEY.SORT]: createSortingParam(defaultSorting)
		};

		for (const key of filterKeys) params[key] = FacetParam;

		return params;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterKeysToken, defaultPageSize, defaultSortingToken]);

	const [params, setParams] = useQueryParams(paramConfig);

	/**
	 * Every write funnels through here. `replaceIn` merges into the query string
	 * already in the address bar rather than rebuilding it, so keys this hook
	 * knows nothing about — the multi-valued `project` the global selector owns,
	 * above all — survive untouched.
	 */
	const update = useCallback(
		(changes: Record<string, unknown>) => setParams(changes, 'replaceIn'),
		[setParams]
	);

	const search = (params[KEY.SEARCH] as string | undefined) ?? '';
	const sorting = (params[KEY.SORT] as SortingState | undefined) ?? EMPTY_SORTING;

	const columnFilters = useMemo<ColumnFiltersState>(() => {
		const filters: ColumnFiltersState = [];

		for (const key of filterKeys) {
			const values = (params[key] as string[] | undefined) ?? [];

			if (values.length) filters.push({ id: key, value: values });
		}

		if (search) filters.push({ id: searchColumnId, value: search });

		return filters;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params, filterKeysToken, searchColumnId, search]);

	const pagination = useMemo<PaginationState>(
		() => ({
			pageIndex: Math.max(0, ((params[KEY.PAGE] as number) ?? 1) - 1),
			pageSize: (params[KEY.PAGE_SIZE] as number) ?? defaultPageSize
		}),
		[params, defaultPageSize]
	);

	const onColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(columnFilters)
					: updaterOrValue;

			const changes: Record<string, unknown> = {};

			for (const key of filterKeys) {
				const entry = next.find((filter) => filter.id === key);
				changes[key] = (entry?.value as string[] | undefined) ?? [];
			}

			const query = next.find((filter) => filter.id === searchColumnId);
			changes[KEY.SEARCH] = String(query?.value ?? '');
			// Narrowing the data invalidates the current offset.
			changes[KEY.PAGE] = 1;

			update(changes);
		},
		[columnFilters, filterKeys, searchColumnId, update]
	);

	const setSearch = useCallback(
		(value: string) => update({ [KEY.SEARCH]: value, [KEY.PAGE]: 1 }),
		[update]
	);

	const onSortingChange = useCallback<OnChangeFn<SortingState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(sorting)
					: updaterOrValue;

			update({ [KEY.SORT]: next });
		},
		[sorting, update]
	);

	const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(pagination)
					: updaterOrValue;

			const sizeChanged = next.pageSize !== pagination.pageSize;

			update({
				[KEY.PAGE_SIZE]: next.pageSize,
				// A bigger page makes the old offset point somewhere else entirely,
				// so resizing always returns to the top of the list.
				[KEY.PAGE]: sizeChanged ? 1 : next.pageIndex + 1
			});
		},
		[pagination, update]
	);

	const clampPage = useCallback(
		(pageCount: number) => {
			if (pageCount <= 0) return;
			if (pagination.pageIndex < pageCount) return;

			update({ [KEY.PAGE]: pageCount });
		},
		[pagination.pageIndex, update]
	);

	const resetFilters = useCallback(() => {
		const changes: Record<string, unknown> = {
			[KEY.SEARCH]: '',
			[KEY.PAGE]: 1
		};

		for (const key of filterKeys) changes[key] = [];

		update(changes);
	}, [filterKeys, update]);

	const queryArgs = useMemo<ClassificationQueryArgs>(() => {
		const filters: Record<string, string[]> = {};

		for (const filter of columnFilters) {
			// The free-text box rides on a column too, but it is `search`, not a
			// facet, and the API takes it under its own name.
			if (filter.id === searchColumnId) continue;
			if (Array.isArray(filter.value) && filter.value.length) {
				filters[filter.id] = filter.value as string[];
			}
		}

		const [sort] = sorting;

		return {
			page: pagination.pageIndex + 1,
			pageSize: pagination.pageSize,
			search: search || undefined,
			ordering: sort ? `${sort.desc ? '-' : ''}${sort.id}` : undefined,
			filters
		};
	}, [columnFilters, pagination, search, sorting, searchColumnId]);

	return {
		pagination,
		onPaginationChange,
		columnFilters,
		onColumnFiltersChange,
		sorting,
		onSortingChange,
		search,
		setSearch,
		hasFilters: columnFilters.length > 0,
		resetFilters,
		clampPage,
		queryArgs
	};
}

/**
 * Column visibility, remembered per table.
 *
 * These tables carry ten columns or so and which ones matter is a standing
 * preference, not a per-visit one — re-hiding the same four columns on every
 * navigation is exactly the chore the control was added to remove. Scoped by
 * `tableKey` so the issues list, the rules list and a run's issues each keep
 * their own answer.
 *
 * `defaults` must be module-level: it feeds the stored snapshot's dependencies,
 * and a fresh object each render would re-read storage on every pass.
 */
export function useColumnVisibility(
	tableKey: string,
	defaults: VisibilityState
) {
	return useLocalStorage<VisibilityState>(
		`bublik.columns.${tableKey}`,
		defaults
	);
}

/**
 * Whether the given pane has anything scrolled above the fold.
 *
 * Only drives the header's shadow, so it is deliberately cheap: a scroll
 * listener that flips one boolean rather than tracking the offset.
 */
export function useIsScrolled(scrollRef?: RefObject<HTMLElement>) {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const container = scrollRef?.current;
		if (!container) return;

		function handleScroll() {
			setIsScrolled((container as HTMLElement).scrollTop > 0);
		}

		handleScroll();
		container.addEventListener('scroll', handleScroll);

		return () => container.removeEventListener('scroll', handleScroll);
	}, [scrollRef]);

	return isScrolled;
}
