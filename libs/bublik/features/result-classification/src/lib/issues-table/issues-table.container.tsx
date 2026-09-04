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

import { useColumnVisibility } from '../classification-table/classification-table.component';
import { useClassificationTableState } from '../classification-table/classification-table.hooks';
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

	// Issues are global; `project` is an optional filter on the backend, so an
	// unscoped request legitimately lists every project. Say which it is.
	const { data: projects } = bublikAPI.useGetAllProjectsQuery();

	// The same ref serves three jobs: scroll-to-top on paging, the shadow under
	// the pinned header, and the shadow over the footer.
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

	// A rule carries `project` as a bare id, and an id is not something anyone
	// recognises a project by.
	const projectNames = useMemo(
		() => new Map((projects ?? []).map((project) => [project.id, project.name])),
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
	// The count the server reports for the *filtered* set, not the rows in hand.
	// Reading it off the page is what made a 45-issue list say "25 of 25".
	const totalCount = issuesQuery.data?.pagination.count ?? 0;
	const columns = useMemo(() => getColumns(projectId), [projectId]);
	const { stateOptions, rulesOptions, categoryOptions, projectOptions } =
		useFacetOptions(rows);

	// The server owns paging, filtering and sorting: the table holds one page, so
	// filtering or sorting it locally would only ever reorder that page while
	// claiming to have reordered the list.
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
		// Filtering and sorting stay client-side, over the page in hand. The API
		// accepts the params (they are sent above) but honours almost none of
		// them yet, so leaving these `true` meant the toolbar did nothing at all
		// — every facet and the search box were inert.
		//
		// Filtering the loaded page is not the same as filtering the list, and at
		// more than one page it will under-report. It is still strictly better
		// than not filtering, and it is forward-compatible: once the API narrows
		// the set itself, the client pass matches everything it is given and
		// quietly becomes a no-op.
		getRowId: (row) => String(row.id),
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	const pageCount = table.getPageCount();

	// A shared link can outlive the rows it pointed at. Client-side pagination
	// does not clamp on its own, so `?page=9` on a four-page table would render
	// nothing at all, with no hint why.
	useEffect(() => clampPage(pageCount), [pageCount, clampPage]);

	const scopeLabel =
		projectId === undefined
			? 'all projects'
			: projects?.find((project) => project.id === projectId)?.name ??
			  `project ${projectId}`;

	if (issuesQuery.isLoading) return <IssuesTableLoading />;

	if (issuesQuery.error) return <IssuesTableError error={issuesQuery.error} />;

	// Only an unfiltered empty result means "there are no issues". With filters
	// on, the empty state belongs inside the table, next to the controls that
	// caused it.
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
