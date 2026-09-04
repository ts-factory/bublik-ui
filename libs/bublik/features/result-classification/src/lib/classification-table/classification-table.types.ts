/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type {
	ColumnFiltersState,
	OnChangeFn,
	PaginationState,
	SortingState
} from '@tanstack/react-table';

export interface ClassificationTableStateConfig<F extends string> {
	filterKeys: readonly F[];
	searchColumnId: string;
	defaultPageSize?: number;
	defaultSorting?: SortingState;
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
}
