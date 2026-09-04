/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect, useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import { useIsScrollbarVisible } from '@/shared/hooks';
import { useGetIssuesQuery, useGetRunIssuesQuery } from '@/services/bublik-api';

import {
	useClassificationTableState,
	useColumnVisibility
} from '../classification-table/classification-table.hooks';
import { RunIssueResults } from '../issue-results-table/issue-results-table.container';
import { getColumns } from './run-issues-table.columns';
import {
	RunIssuesTableEmpty,
	RunIssuesTableError,
	RunIssuesTableLoading,
	RunIssuesTableView
} from './run-issues-table.component';
import {
	COLUMN_ID,
	COLUMN_VISIBILITY_KEY,
	DEFAULT_COLUMN_VISIBILITY,
	FILTER_KEYS
} from './run-issues-table.constants';
import { useFacetOptions } from './run-issues-table.hooks';
import type { RunIssuesTableProps } from './run-issues-table.types';

export function RunIssuesTable({
	runId,
	projectId,
	toolbarActions
}: RunIssuesTableProps) {
	const { data, isLoading, error } = useGetRunIssuesQuery(
		projectId === undefined ? skipToken : { runId, projectId }
	);

	// TODO(api): only needed for the description and for the row the edit form
	// starts from, neither of which `run_issues_summary` returns. Unlike the
	// same-page joins elsewhere in this feature this one is sound rather than
	// approximate — `/runs/{id}/issues/` is unpaginated and a run holds a
	// handful of issues, so a single large page covers every id it can name.
	// Adding `description` to that endpoint makes it dead code.
	const { data: allIssues } = useGetIssuesQuery(
		projectId === undefined ? skipToken : { projectId, page: 1, pageSize: 1000 }
	);

	const issueById = useMemo(
		() => new Map((allIssues?.results ?? []).map((issue) => [issue.id, issue])),
		[allIssues]
	);

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
		clampPage
	} = useClassificationTableState({
		filterKeys: FILTER_KEYS,
		searchColumnId: COLUMN_ID.ISSUE,
		defaultSorting: [{ id: COLUMN_ID.RESULTS, desc: true }]
	});

	const issues = useMemo(
		() =>
			(data ?? []).map((row) => ({
				...row,
				description: row.description ?? issueById.get(row.issue_id)?.description
			})),
		[data, issueById]
	);
	const columns = useMemo(
		() => getColumns(projectId, issueById),
		[projectId, issueById]
	);
	const { stateOptions, effectOptions, categoryOptions } =
		useFacetOptions(issues);

	const table = useReactTable({
		data: issues,
		columns,
		state: {
			columnFilters,
			sorting,
			pagination,
			columnVisibility
		},
		onColumnVisibilityChange: setColumnVisibility,
		onColumnFiltersChange,
		onSortingChange,
		onPaginationChange,
		getRowId: (row) => String(row.issue_id),
		getRowCanExpand: () => true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getExpandedRowModel: getExpandedRowModel()
	});

	const pageCount = table.getPageCount();

	useEffect(() => clampPage(pageCount), [pageCount, clampPage]);

	if (isLoading || projectId === undefined) return <RunIssuesTableLoading />;

	if (error) return <RunIssuesTableError error={error} />;

	if (!issues.length) return <RunIssuesTableEmpty />;

	return (
		<RunIssuesTableView
			table={table}
			scrollRef={scrollRef}
			isScrollable={isScrollable}
			search={search}
			onSearchChange={setSearch}
			stateOptions={stateOptions}
			effectOptions={effectOptions}
			categoryOptions={categoryOptions}
			hasFilters={hasFilters}
			onResetFilters={resetFilters}
			toolbarActions={toolbarActions}
			totalCount={issues.length}
			renderSubRow={(row) => (
				<RunIssueResults
					runId={runId}
					issueId={row.original.issue_id}
					projectId={projectId}
				/>
			)}
		/>
	);
}
