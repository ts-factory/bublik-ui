/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo } from 'react';
import {
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { useIsScrollbarVisible } from '@/shared/hooks';
import {
	bublikAPI,
	useGetIssueRulesQuery,
	useGetIssuesQuery
} from '@/services/bublik-api';
import { useProjectSearch } from '@/bublik/features/projects';

import {
	useClassificationTableState,
	useColumnVisibility
} from '../classification-table/classification-table.hooks';
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
	DEFAULT_COLUMN_VISIBILITY,
	DEFAULT_PAGE_SIZE,
	FILTER_KEYS
} from './issues-table.constants';
import { useFacetOptions } from './issues-table.hooks';
import type { IssuesTableProps } from './issues-table.types';
import { buildRows } from './issues-table.utils';

export function IssuesTable({ toolbarActions }: IssuesTableProps = {}) {
	const { projectIds } = useProjectSearch();
	const projectId = projectIds[0];

	const { data: projects } = bublikAPI.useGetAllProjectsQuery();

	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
	const [columnVisibility, setColumnVisibility] = useColumnVisibility(
		COLUMN_VISIBILITY_KEY,
		DEFAULT_COLUMN_VISIBILITY
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
		defaultSorting: [{ id: COLUMN_ID.CREATED, desc: true }]
	});

	const issuesQuery = useGetIssuesQuery({
		projectId,
		page: queryArgs.page,
		pageSize: queryArgs.pageSize,
		search: queryArgs.search,
		ordering: queryArgs.ordering,
		state: queryArgs.filters[COLUMN_ID.STATE],
		category: queryArgs.filters[COLUMN_ID.CATEGORIES],
		rules: queryArgs.filters[COLUMN_ID.RULES]
	});

	// TODO(api): only needed until `/issues/` carries `categories` and the rule
	// counts itself. It is fetched for the same page so the join covers at least
	// the rows on screen, but it cannot be right in general — two independently
	// paginated lists do not line up.
	const rulesQuery = useGetIssueRulesQuery({
		projectId,
		page: queryArgs.page,
		pageSize: queryArgs.pageSize
	});

	const projectNames = useMemo(
		() =>
			new Map((projects ?? []).map((project) => [project.id, project.name])),
		[projects]
	);

	const rows = useMemo(
		() =>
			buildRows(
				issuesQuery.data?.results ?? [],
				rulesQuery.data?.results ?? [],
				projectNames
			),
		[issuesQuery.data, rulesQuery.data, projectNames]
	);
	const totalCount = issuesQuery.data?.pagination.count ?? 0;
	const columns = useMemo(() => getColumns(), []);
	const { stateOptions, rulesOptions, categoryOptions, projectOptions } =
		useFacetOptions(rows);

	const table = useReactTable({
		data: rows,
		columns,
		state: { columnFilters, sorting, pagination, columnVisibility },
		onColumnVisibilityChange: setColumnVisibility,
		onColumnFiltersChange,
		onSortingChange,
		onPaginationChange,
		rowCount: totalCount,
		manualPagination: true,
		getRowId: (row) => String(row.id),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel()
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
			search={search}
			onSearchChange={setSearch}
			stateOptions={stateOptions}
			rulesOptions={rulesOptions}
			categoryOptions={categoryOptions}
			projectOptions={projectOptions}
			hasFilters={hasFilters}
			onResetFilters={resetFilters}
			toolbarActions={toolbarActions}
			totalCount={totalCount}
		/>
	);
}
