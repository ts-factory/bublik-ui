/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
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

import {
	useClassificationTableState,
	useColumnVisibility
} from '../classification-table/classification-table.hooks';
import { getColumns } from './issue-rules-table.columns';
import {
	IssueRulesTableEmpty,
	IssueRulesTableError,
	IssueRulesTableLoading,
	IssueRulesTableView
} from './issue-rules-table.component';
import {
	COLUMN_ID,
	COLUMN_VISIBILITY_KEY,
	DEFAULT_COLUMN_VISIBILITY,
	DEFAULT_PAGE_SIZE,
	FILTER_KEYS
} from './issue-rules-table.constants';
import { useFacetOptions } from './issue-rules-table.hooks';
import type { IssueRulesTableProps } from './issue-rules-table.types';
import { buildRows } from './issue-rules-table.utils';

export function IssueRulesTable({
	issueId,
	projectId,
	toolbarActions
}: IssueRulesTableProps) {
	const showIssue = issueId === undefined;

	// The same ref serves three jobs: scroll-to-top on paging, the shadow under
	// the pinned header, and the shadow over the footer.
	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
	const [columnVisibility, setColumnVisibility] = useColumnVisibility(
		showIssue
			? COLUMN_VISIBILITY_KEY.ALL_RULES
			: COLUMN_VISIBILITY_KEY.ONE_ISSUE,
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
		searchColumnId: COLUMN_ID.TEST,
		defaultPageSize: DEFAULT_PAGE_SIZE,
		defaultSorting: [{ id: COLUMN_ID.TEST, desc: false }]
	});

	const {
		data: rulesData,
		isLoading: isRulesLoading,
		error: rulesError
	} = useGetIssueRulesQuery({
		projectId,
		issue: issueId,
		page: queryArgs.page,
		pageSize: queryArgs.pageSize,
		search: queryArgs.search,
		ordering: queryArgs.ordering,
		category: queryArgs.filters[COLUMN_ID.CATEGORY],
		expected: queryArgs.filters[COLUMN_ID.DISPOSITION],
		active: queryArgs.filters[COLUMN_ID.ACTIVE]
	});

	// TODO(api): needed only to name the issue behind each rule, which
	// `/issue_rules/` could embed. Fetched a page at a time like the rules, so
	// beyond page one some rows fall back to `#id` until it does.
	const {
		data: issuesData,
		isLoading: isIssuesLoading,
		error: issuesError
	} = useGetIssuesQuery(
		showIssue
			? {
					projectId,
					page: queryArgs.page,
					pageSize: queryArgs.pageSize,
					state: queryArgs.filters[COLUMN_ID.ISSUE_STATE]
			  }
			: skipToken
	);

	// A rule carries `project` as a bare id, and an id is not something anyone
	// recognises a project by.
	const { data: projects } = bublikAPI.useGetAllProjectsQuery();
	const projectNames = useMemo(
		() =>
			new Map((projects ?? []).map((project) => [project.id, project.name])),
		[projects]
	);

	const rules = useMemo(
		() =>
			buildRows(
				rulesData?.results ?? [],
				issuesData?.results ?? [],
				projectNames
			),
		[rulesData, issuesData, projectNames]
	);
	// What the server says the filtered set holds, not what this page holds —
	// the difference between "25 of 45 rules" and the old "25 of 25".
	const totalCount = rulesData?.pagination.count ?? 0;
	const columns = useMemo(() => getColumns({ showIssue }), [showIssue]);
	const {
		categoryOptions,
		dispositionOptions,
		activeOptions,
		issueStateOptions,
		parameterOptions,
		verdictOptions,
		tagOptions,
		projectOptions
	} = useFacetOptions(rules);

	// Server-owned paging, filtering and sorting: this table holds one page, and
	// filtering it locally would narrow that page while claiming to have narrowed
	// the list.
	const table = useReactTable({
		data: rules,
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

	if (isRulesLoading || isIssuesLoading) return <IssueRulesTableLoading />;

	const error = rulesError ?? issuesError;
	if (error) return <IssueRulesTableError error={error} />;

	// Only an unfiltered empty result means "there are no rules"; with filters on,
	// the empty state belongs in the table beside the controls that caused it.
	if (!totalCount && !hasFilters && !search) {
		return (
			<IssueRulesTableEmpty showIssue={showIssue}>
				{toolbarActions}
			</IssueRulesTableEmpty>
		);
	}

	return (
		<IssueRulesTableView
			table={table}
			scrollRef={scrollRef}
			isScrollable={isScrollable}
			showIssue={showIssue}
			search={search}
			onSearchChange={setSearch}
			projectOptions={projectOptions}
			issueStateOptions={issueStateOptions}
			categoryOptions={categoryOptions}
			dispositionOptions={dispositionOptions}
			activeOptions={activeOptions}
			parameterOptions={parameterOptions}
			verdictOptions={verdictOptions}
			tagOptions={tagOptions}
			hasFilters={hasFilters}
			onResetFilters={resetFilters}
			toolbarActions={toolbarActions}
			totalCount={totalCount}
		/>
	);
}
