/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type {
	ColumnFiltersState,
	OnChangeFn,
	PaginationState,
	SortingState
} from '@tanstack/react-table';

import { config } from '@/bublik/config';

/**
 * Table view state, held in the URL.
 *
 * Two rules govern everything here:
 *
 * 1. **Copy, then mutate.** Every write starts from the current params and only
 *    touches its own keys. `project` is multi-valued (`useProjectSearch` reads
 *    it with `getAll`), so anything that rebuilds the query string from scratch
 *    silently drops the second project and switches the page's scope.
 * 2. **Defaults are absent, not written.** Page 1 and the default page size
 *    never appear in the URL, so the canonical view of a table is its bare
 *    path and a shared link carries only what was actually changed.
 *
 * Writes are `replace`, unlike `useHistoryPagination`, which pushes. These are
 * view controls, not navigation: pushing an entry per keystroke and per facet
 * click makes the back button unusable for leaving the page.
 */

/** Mirrors `DEFAULT_PAGE_SIZES` in the shared `Pagination` component. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 75, 100] as const;

const DEFAULT_PAGE_SIZE = 25;

const KEY = {
	PAGE: 'page',
	PAGE_SIZE: 'pageSize',
	SEARCH: 'q',
	SORT: 'sort'
} as const;

/** Distinguishes "sorted by nothing" from "sorting untouched". */
const SORT_NONE = 'none';

const DELIMITER = config.queryDelimiter;

export interface ClassificationTableStateConfig<F extends string> {
	/**
	 * The faceted filter columns. Each value is used verbatim as both the
	 * column id and the URL key, so they must match the table's `COLUMN_ID`.
	 */
	filterKeys: readonly F[];
	/** The column that carries the toolbar's free-text filter. */
	searchColumnId: string;
	defaultPageSize?: number;
	defaultSorting?: SortingState;
}

export interface ClassificationTableState {
	pagination: PaginationState;
	onPaginationChange: OnChangeFn<PaginationState>;
	columnFilters: ColumnFiltersState;
	onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	search: string;
	setSearch: (value: string) => void;
	/** True when any facet or the search box is narrowing the table. */
	hasFilters: boolean;
	resetFilters: () => void;
	/** Pulls an out-of-range `?page=` back into range once rows are known. */
	clampPage: (pageCount: number) => void;
	/**
	 * The same state, shaped for the API. Everything the server needs to
	 * reproduce this view is already in the URL, so this is a projection rather
	 * than a second source of truth — the URL contract is unchanged and old
	 * shared links keep resolving.
	 *
	 * Filter values come back keyed by column id, which is also the URL key and
	 * the query param name; a table maps them onto its own args.
	 */
	queryArgs: ClassificationQueryArgs;
}

export interface ClassificationQueryArgs {
	/** 1-based, as DRF counts pages. */
	page: number;
	pageSize: number;
	search?: string;
	/** DRF ordering: the field name, `-` prefixed for descending. */
	ordering?: string;
	filters: Record<string, string[]>;
}

function parseSorting(
	raw: string | null,
	fallback: SortingState
): SortingState {
	if (raw === null) return fallback;
	if (raw === SORT_NONE) return [];

	const [id, direction] = raw.split(':');
	if (!id) return fallback;

	return [{ id, desc: direction === 'desc' }];
}

function serializeSorting(sorting: SortingState): string {
	const first = sorting[0];
	if (!first) return SORT_NONE;

	return `${first.id}:${first.desc ? 'desc' : 'asc'}`;
}

function sameSorting(a: SortingState, b: SortingState): boolean {
	return serializeSorting(a) === serializeSorting(b);
}

function parsePageSize(raw: string | null, fallback: number): number {
	const value = Number(raw);

	return PAGE_SIZE_OPTIONS.includes(value as (typeof PAGE_SIZE_OPTIONS)[number])
		? value
		: fallback;
}

export function useClassificationTableState<F extends string>({
	filterKeys,
	searchColumnId,
	defaultPageSize = DEFAULT_PAGE_SIZE,
	defaultSorting = []
}: ClassificationTableStateConfig<F>): ClassificationTableState {
	const [searchParams, setSearchParams] = useSearchParams();

	const search = searchParams.get(KEY.SEARCH) ?? '';

	const columnFilters = useMemo<ColumnFiltersState>(() => {
		const filters: ColumnFiltersState = [];

		for (const key of filterKeys) {
			const values = (searchParams.get(key) ?? '')
				.split(DELIMITER)
				.map((value) => value.trim())
				.filter(Boolean);

			if (values.length) filters.push({ id: key, value: values });
		}

		const query = searchParams.get(KEY.SEARCH);
		if (query) filters.push({ id: searchColumnId, value: query });

		return filters;
	}, [searchParams, filterKeys, searchColumnId]);

	const sorting = useMemo(
		() => parseSorting(searchParams.get(KEY.SORT), defaultSorting),
		// `defaultSorting` is a literal at every call site, so identity churn
		// would re-run this every render; the serialized form is what matters.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[searchParams, serializeSorting(defaultSorting)]
	);

	const pagination = useMemo<PaginationState>(
		() => ({
			pageIndex: Math.max(0, Number(searchParams.get(KEY.PAGE) ?? 1) - 1),
			pageSize: parsePageSize(searchParams.get(KEY.PAGE_SIZE), defaultPageSize)
		}),
		[searchParams, defaultPageSize]
	);

	/** Every write funnels through here so rule 1 above holds by construction. */
	const update = useCallback(
		(mutate: (params: URLSearchParams) => void) => {
			setSearchParams(
				(previous) => {
					const params = new URLSearchParams(previous);
					mutate(params);
					return params;
				},
				{ replace: true }
			);
		},
		[setSearchParams]
	);

	const writePage = useCallback((params: URLSearchParams, page: number) => {
		if (page <= 1) params.delete(KEY.PAGE);
		else params.set(KEY.PAGE, String(page));
	}, []);

	const onColumnFiltersChange = useCallback<OnChangeFn<ColumnFiltersState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(columnFilters)
					: updaterOrValue;

			update((params) => {
				for (const key of filterKeys) {
					const entry = next.find((filter) => filter.id === key);
					const values = (entry?.value as string[] | undefined) ?? [];

					if (values.length) params.set(key, values.join(DELIMITER));
					else params.delete(key);
				}

				const query = next.find((filter) => filter.id === searchColumnId);
				const text = String(query?.value ?? '');

				if (text) params.set(KEY.SEARCH, text);
				else params.delete(KEY.SEARCH);

				// Narrowing the data invalidates the current offset.
				writePage(params, 1);
			});
		},
		[columnFilters, filterKeys, searchColumnId, update, writePage]
	);

	const setSearch = useCallback(
		(value: string) => {
			update((params) => {
				if (value) params.set(KEY.SEARCH, value);
				else params.delete(KEY.SEARCH);
				writePage(params, 1);
			});
		},
		[update, writePage]
	);

	const onSortingChange = useCallback<OnChangeFn<SortingState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(sorting)
					: updaterOrValue;

			update((params) => {
				if (sameSorting(next, defaultSorting)) params.delete(KEY.SORT);
				else params.set(KEY.SORT, serializeSorting(next));
			});
		},
		[sorting, defaultSorting, update]
	);

	const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(pagination)
					: updaterOrValue;

			update((params) => {
				const sizeChanged = next.pageSize !== pagination.pageSize;

				if (next.pageSize === defaultPageSize) params.delete(KEY.PAGE_SIZE);
				else params.set(KEY.PAGE_SIZE, String(next.pageSize));

				// A bigger page makes the old offset point somewhere else entirely,
				// so resizing always returns to the top of the list.
				writePage(params, sizeChanged ? 1 : next.pageIndex + 1);
			});
		},
		[pagination, defaultPageSize, update, writePage]
	);

	const clampPage = useCallback(
		(pageCount: number) => {
			if (pageCount <= 0) return;
			if (pagination.pageIndex < pageCount) return;

			update((params) => writePage(params, pageCount));
		},
		[pagination.pageIndex, update, writePage]
	);

	const resetFilters = useCallback(() => {
		update((params) => {
			filterKeys.forEach((key) => params.delete(key));
			params.delete(KEY.SEARCH);
			params.delete(KEY.PAGE);
		});
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
