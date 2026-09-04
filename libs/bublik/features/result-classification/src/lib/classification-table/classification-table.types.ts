/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type {
	ColumnFiltersState,
	OnChangeFn,
	PaginationState,
	SortingState
} from '@tanstack/react-table';

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

export interface ClassificationQueryArgs {
	/** 1-based, as DRF counts pages. */
	page: number;
	pageSize: number;
	search?: string;
	/** DRF ordering: the field name, `-` prefixed for descending. */
	ordering?: string;
	filters: Record<string, string[]>;
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
