/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo } from 'react';
import {
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getGroupedRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { useIsScrollbarVisible } from '@/shared/hooks';
import {
	bublikAPI,
	useGetIssuesFacetsQuery,
	useGetIssuesQuery
} from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';

import {
	useClassificationTableState,
	useColumnOrder,
	useColumnVisibility,
	useGroupedExpanded
} from '../classification-table/classification-table.hooks';
import { KEY } from '../classification-table/classification-table.constants';
import { getColumns } from './issues-table.columns';
import {
	IssuesTableEmpty,
	IssuesTableError,
	IssuesTableLoading,
	IssuesTableView
} from './issues-table.component';
import {
	COLUMN_ID,
	COLUMN_VISIBILITY_KEY,
	DEFAULT_COLUMN_ORDER,
	DEFAULT_COLUMN_VISIBILITY,
	DEFAULT_PAGE_SIZE,
	FILTER_KEYS,
	ORDERING_BY_COLUMN_ID,
	PINNED_COLUMNS
} from './issues-table.constants';
import { useFacetOptions } from './issues-table.hooks';
import type { IssuesTableProps } from './issues-table.types';
import { buildRows } from './issues-table.utils';

/**
 * Always grouped, even with one project picked: the heading is where the
 * project's name and its New Issue button live, and a reader switching
 * projects keeps the same picture rather than watching the headings vanish.
 */
const GROUP_BY_PROJECT = [COLUMN_ID.PROJECT];

export function IssuesTable({ toolbarActions }: IssuesTableProps = {}) {
	const { projectIds } = useProjectSearch();
	const projectId = projectIds[0];

	const { data: projects } = bublikAPI.useGetAllProjectsQuery();

	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
	const [columnVisibility, setColumnVisibility] = useColumnVisibility(
		COLUMN_VISIBILITY_KEY,
		DEFAULT_COLUMN_VISIBILITY,
		{ queryKey: KEY.COLUMNS }
	);
	const [columnOrder, setColumnOrder] = useColumnOrder(
		COLUMN_VISIBILITY_KEY,
		DEFAULT_COLUMN_ORDER,
		PINNED_COLUMNS,
		{ queryKey: KEY.COLUMN_ORDER }
	);
	const {
		pagination,
		onPaginationChange,
		columnFilters,
		onColumnFiltersChange,
		sorting,
		onSortingChange,
		search,
		setSearch,
		hasFilters,
		resetFilters,
		clampPage,
		queryArgs
	} = useClassificationTableState({
		filterKeys: FILTER_KEYS,
		searchColumnId: COLUMN_ID.ISSUE,
		defaultPageSize: DEFAULT_PAGE_SIZE,
		defaultSorting: [{ id: COLUMN_ID.CREATED, desc: true }],
		orderingByColumnId: ORDERING_BY_COLUMN_ID
	});

	const filterArgs = {
		projectId,
		search: queryArgs.search,
		state: queryArgs.filters[COLUMN_ID.STATE],
		category: queryArgs.filters[COLUMN_ID.CATEGORIES],
		rules: queryArgs.filters[COLUMN_ID.RULES]
	};
	const issuesQuery = useGetIssuesQuery({
		...filterArgs,
		page: queryArgs.page,
		pageSize: queryArgs.pageSize,
		ordering: queryArgs.ordering
	});
	const { data: facets } = useGetIssuesFacetsQuery(filterArgs);

	const projectNames = useMemo(
		() =>
			new Map((projects ?? []).map((project) => [project.id, project.name])),
		[projects]
	);

	const rows = useMemo(
		() => buildRows(issuesQuery.data?.results ?? [], projectNames),
		[issuesQuery.data, projectNames]
	);
	const totalCount = issuesQuery.data?.pagination.count ?? 0;
	// The project groups a reader folded away.
	const [expanded, setExpanded] = useGroupedExpanded(
		COLUMN_ID.PROJECT,
		rows.map((row) => row.project)
	);
	const columns = useMemo(() => getColumns(), []);
	const { stateOptions, rulesOptions, categoryOptions } = useFacetOptions(
		rows,
		facets
	);

	const table = useReactTable({
		data: rows,
		columns,
		state: {
			columnFilters,
			sorting,
			pagination,
			columnVisibility,
			columnOrder,
			grouping: GROUP_BY_PROJECT,
			expanded
		},
		onColumnVisibilityChange: setColumnVisibility,
		onColumnOrderChange: setColumnOrder,
		onColumnFiltersChange,
		onSortingChange,
		onPaginationChange,
		onExpandedChange: setExpanded,
		rowCount: totalCount,
		manualPagination: true,
		getRowId: (row) => String(row.id),
		getRowCanExpand: (row) => row.getIsGrouped(),
		autoResetExpanded: false,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getGroupedRowModel: getGroupedRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	const pageCount = table.getPageCount();

	useEffect(() => clampPage(pageCount), [pageCount, clampPage]);

	const scopeLabel =
		projectId === undefined
			? 'all projects'
			: projects?.find((project) => project.id === projectId)?.name ??
			  `project ${projectId}`;

	if (issuesQuery.isLoading) return <IssuesTableLoading />;

	if (issuesQuery.error) return <IssuesTableError error={issuesQuery.error} />;

	if (!totalCount && !hasFilters && !search) {
		return (
			<IssuesTableEmpty scopeLabel={scopeLabel}>
				{toolbarActions}
			</IssuesTableEmpty>
		);
	}

	return (
		<IssuesTableView
			table={table}
			scrollRef={scrollRef}
			isScrollable={isScrollable}
			columnOrder={columnOrder}
			onColumnOrderChange={setColumnOrder}
			search={search}
			onSearchChange={setSearch}
			stateOptions={stateOptions}
			rulesOptions={rulesOptions}
			categoryOptions={categoryOptions}
			hasFilters={hasFilters}
			onResetFilters={resetFilters}
			toolbarActions={toolbarActions}
			totalCount={totalCount}
		/>
	);
}
