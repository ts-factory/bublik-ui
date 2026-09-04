/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
	useQueryParam,
	useQueryParams,
	type QueryParamConfigMap
} from 'use-query-params';
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
	ColumnsParam,
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

export function useClassificationTableState<F extends string>({
	filterKeys,
	searchColumnId,
	defaultPageSize = DEFAULT_PAGE_SIZE,
	defaultSorting = EMPTY_SORTING
}: ClassificationTableStateConfig<F>): ClassificationTableState {
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

	const update = useCallback(
		(changes: Record<string, unknown>) => setParams(changes, 'replaceIn'),
		[setParams]
	);

	const search = (params[KEY.SEARCH] as string | undefined) ?? '';
	const sorting =
		(params[KEY.SORT] as SortingState | undefined) ?? EMPTY_SORTING;

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

const NO_OVERRIDES: VisibilityState = {};

/**
 * The param name used when a table has not opted into URL-backed columns. It is
 * only ever read, never written, so it stays absent from every URL.
 */
const UNUSED_QUERY_KEY = 'columns';

/** The columns whose visibility differs from what `defaults` would give them. */
function diffVisibility(
	state: VisibilityState,
	defaults: VisibilityState
): VisibilityState {
	const overrides: VisibilityState = {};

	for (const [id, visible] of Object.entries(state)) {
		// A column missing from a visibility state is visible.
		if (visible !== (defaults[id] ?? true)) overrides[id] = visible;
	}

	return overrides;
}

function hasOverrides(overrides: VisibilityState) {
	return Object.keys(overrides).length > 0;
}

/**
 * Column visibility resolved as URL → localStorage → `defaults`.
 *
 * What is stored is the *diff* against `defaults`, not the whole state, which is
 * what lets `defaults` depend on how much room the table has. Hiding a column
 * that the current default already hides records nothing, so it comes back when
 * there is room for it again; showing one explicitly records `+id` and it stays
 * shown at every width until it is hidden again.
 *
 * Pass `queryKey` to put the diff in the URL as well, making a column set
 * linkable. Without it the hook is localStorage-only, as it was before.
 */
export function useColumnVisibility(
	tableKey: string,
	defaults: VisibilityState,
	options: { queryKey?: string } = {}
): [VisibilityState, OnChangeFn<VisibilityState>] {
	const { queryKey } = options;

	const [storedOverrides, setStoredOverrides] =
		useLocalStorage<VisibilityState>(
			`bublik.columns.${tableKey}`,
			NO_OVERRIDES
		);

	const [queryOverrides, setQueryOverrides] = useQueryParam<VisibilityState>(
		queryKey ?? UNUSED_QUERY_KEY,
		ColumnsParam
	);

	const overrides =
		queryKey && hasOverrides(queryOverrides) ? queryOverrides : storedOverrides;

	// Tokens rather than the objects themselves: both sides are rebuilt on most
	// renders, and only a change in what they *say* should move the table.
	const defaultsToken = ColumnsParam.encode(defaults) ?? '';
	const overridesToken = ColumnsParam.encode(overrides) ?? '';

	const columnVisibility = useMemo(
		() => ({ ...defaults, ...overrides }),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[defaultsToken, overridesToken]
	);

	const setColumnVisibility = useCallback<OnChangeFn<VisibilityState>>(
		(updaterOrValue) => {
			const next =
				typeof updaterOrValue === 'function'
					? updaterOrValue(columnVisibility)
					: updaterOrValue;

			const nextOverrides = diffVisibility(next, defaults);

			setStoredOverrides(nextOverrides);
			if (queryKey) setQueryOverrides(nextOverrides, 'replaceIn');
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[columnVisibility, defaultsToken, queryKey, setQueryOverrides, setStoredOverrides]
	);

	return [columnVisibility, setColumnVisibility];
}

/**
 * The measured width of an element, via a callback ref.
 *
 * A callback ref rather than a `RefObject` because the tables mount their
 * scroller only after loading resolves: an effect keyed on a ref object runs
 * once, while the node is still absent, and never measures anything.
 */
export function useElementWidth<T extends HTMLElement>() {
	const [width, setWidth] = useState<number>();
	const observerRef = useRef<ResizeObserver>();

	const ref = useCallback((node: T | null) => {
		observerRef.current?.disconnect();

		if (!node) return;

		const observer = new ResizeObserver(([entry]) =>
			setWidth(entry.contentRect.width)
		);

		observer.observe(node);
		observerRef.current = observer;
		setWidth(node.clientWidth);
	}, []);

	useEffect(() => () => observerRef.current?.disconnect(), []);

	return [ref, width] as const;
}

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
