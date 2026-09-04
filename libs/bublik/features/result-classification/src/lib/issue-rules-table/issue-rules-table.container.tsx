/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
	getCoreRowModel,
	getExpandedRowModel,
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
	useColumnVisibility,
	useElementWidth
} from '../classification-table/classification-table.hooks';
import { RuleDetail } from './components';
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
	COMPACT_COLUMN_VISIBILITY,
	COMPACT_WIDTH_PX,
	DEFAULT_COLUMN_VISIBILITY,
	DEFAULT_PAGE_SIZE,
	FILTER_KEYS
} from './issue-rules-table.constants';
import { useFacetOptions } from './issue-rules-table.hooks';
import type { IssueRulesTableProps } from './issue-rules-table.types';
import { buildRows } from './issue-rules-table.utils';

/** URL param carrying the reader's column choices, so a view stays linkable. */
const COLUMNS_QUERY_KEY = 'cols';

export function IssueRulesTable({
	issueId,
	projectId,
	toolbarActions
}: IssueRulesTableProps) {
	const showIssue = issueId === undefined;

	const [scrollRef, isScrollable] = useIsScrollbarVisible<HTMLDivElement>();
	const [widthRef, width] = useElementWidth<HTMLDivElement>();

	// Undefined until the first measurement, which we read as "there is room":
	// the wide layout is the better guess for the frame before we know.
	const compact =
		width !== undefined &&
		width <
			COMPACT_WIDTH_PX[showIssue ? 'ALL_RULES' : 'ONE_ISSUE'];

	const columnDefaults = compact
		? COMPACT_COLUMN_VISIBILITY
		: DEFAULT_COLUMN_VISIBILITY;

	const [columnVisibility, setColumnVisibility] = useColumnVisibility(
		showIssue
			? COLUMN_VISIBILITY_KEY.ALL_RULES
			: COLUMN_VISIBILITY_KEY.ONE_ISSUE,
		columnDefaults,
		{ queryKey: COLUMNS_QUERY_KEY }
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
	const totalCount = rulesData?.pagination.count ?? 0;
	const columns = useMemo(
		() => getColumns({ showIssue, compact }),
		[showIssue, compact]
	);
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
		getRowId: (row) => String(row.id),
		getRowCanExpand: () => compact,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	const pageCount = table.getPageCount();

	useEffect(() => clampPage(pageCount), [pageCount, clampPage]);

	if (isRulesLoading || isIssuesLoading) return <IssueRulesTableLoading />;

	const error = rulesError ?? issuesError;
	if (error) return <IssueRulesTableError error={error} />;

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
			widthRef={widthRef}
			isScrollable={isScrollable}
			renderSubRow={compact ? (row) => <RuleDetail row={row} /> : undefined}
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
