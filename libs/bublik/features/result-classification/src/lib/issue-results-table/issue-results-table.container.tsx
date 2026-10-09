/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
	getCoreRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import {
	useGetIssueResultsQuery,
	useGetRunIssueResultsQuery
} from '@/services/bublik-api';
import { getColumns } from './issue-results-table.columns';
import {
	IssueResultsTable,
	IssueResultsTableEmpty,
	IssueResultsTableError,
	IssueResultsTableLoading
} from './issue-results-table.component';
import type { IssueResultsProps, ResultRow } from './issue-results-table.types';

export function IssueResults({
	runId,
	issueId,
	projectId,
	scrollRef,
	renderResultPreview
}: IssueResultsProps) {
	const isRunScoped = runId !== undefined;

	const runQuery = useGetRunIssueResultsQuery(
		isRunScoped && projectId !== undefined
			? { runId, issueId, projectId }
			: skipToken
	);

	const issueQuery = useGetIssueResultsQuery(
		!isRunScoped ? { issueId, projectId } : skipToken
	);

	const { data, isLoading, error } = isRunScoped ? runQuery : issueQuery;

	const results = useMemo<ResultRow[]>(() => data ?? [], [data]);
	const columns = useMemo(
		() => getColumns(runId, renderResultPreview),
		[runId, renderResultPreview]
	);

	const table = useReactTable({
		data: results,
		columns,
		getRowId: (row) => String(row.result_id),
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	if (isLoading || (isRunScoped && projectId === undefined)) {
		return <IssueResultsTableLoading />;
	}

	if (error) return <IssueResultsTableError error={error} />;

	if (!results.length) return <IssueResultsTableEmpty />;

	return <IssueResultsTable table={table} scrollRef={scrollRef} />;
}

export function RunIssueResults(
	props: IssueResultsProps & { runId: number | string }
) {
	return <IssueResults {...props} />;
}
