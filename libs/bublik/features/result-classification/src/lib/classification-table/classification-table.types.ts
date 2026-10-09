/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type {
	ColumnFiltersState,
	ExpandedState,
	OnChangeFn,
	PaginationState,
	SortingState
} from '@tanstack/react-table';

export interface ClassificationTableStateConfig<F extends string> {
	filterKeys: readonly F[];
	/**
	 * The filter keys whose values are free text, kept in the URL as one param
	 * per value (`RepeatedFacetParam`) rather than a `;` list.
	 */
	repeatedFilterKeys?: readonly F[];
	searchColumnId: string;
	defaultPageSize?: number;
	defaultSorting?: SortingState;
	/**
	 * Column id -> the field name DRF's `OrderingFilter` knows it by, for the
	 * columns whose two names differ. A column absent from the map orders by its
	 * own id; a column mapped to `null` cannot be ordered server-side at all and
	 * sends no `ordering` (the table still sorts the page it holds).
	 */
	orderingByColumnId?: Record<string, string | null>;
}

export interface ClassificationQueryArgs {
	page: number;
	pageSize: number;
	search?: string;
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
	hasFilters: boolean;
	resetFilters: () => void;
	clampPage: (pageCount: number) => void;
	queryArgs: ClassificationQueryArgs;
	/**
	 * Which sub-rows are open, in the URL — so a link to "this issue's results"
	 * is a link, and a reload does not collapse what you had opened.
	 *
	 * Only meaningful for the tables that expand; the rest can ignore both.
	 */
	expanded: ExpandedState;
	onExpandedChange: OnChangeFn<ExpandedState>;
}
