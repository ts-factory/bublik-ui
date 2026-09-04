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
import type { IssueResultRow } from '@/shared/types';

import { getColumns } from './issue-results-table.columns';
import {
	IssueResultsTable,
	IssueResultsTableEmpty,
	IssueResultsTableError,
	IssueResultsTableLoading
} from './issue-results-table.component';
import type {
	IssueResultsProps,
	ResultRow
} from './issue-results-table.types';

/**
 * The results an issue is stamped on, either within one run or across all of
 * them. One component for both because the row is the same shape and the reader
 * wants the same next steps; only the scope of the question differs.
 */
export function IssueResults({ runId, issueId, projectId }: IssueResultsProps) {
	const isRunScoped = runId !== undefined;

	// Run-scoped: an unscoped answer is never the one we want, and projectId
	// arrives a render late (it comes from the run details query).
	const runQuery = useGetRunIssueResultsQuery(
		isRunScoped && projectId !== undefined
			? { runId, issueId, projectId }
			: skipToken
	);

	// TODO(api): `/issues/{id}/results` does not exist yet, so the issue-wide
	// view 404s into the error state. The wiring is here so the sub-row starts
	// working the moment the endpoint lands.
	const issueQuery = useGetIssueResultsQuery(
		!isRunScoped ? { issueId, projectId } : skipToken
	);

	const { data, isLoading, error } = isRunScoped ? runQuery : issueQuery;

	const results = useMemo<ResultRow[]>(
		() => (data as ResultRow[] | IssueResultRow[] | undefined) ?? [],
		[data]
	);
	const columns = useMemo(() => getColumns(runId), [runId]);

	const table = useReactTable({
		data: results,
		columns,
		getRowId: (row) => String(row.result_id),
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	// A run-scoped query with no projectId yet is skipped, so isLoading is false.
	// Keep the skeleton up rather than flashing an empty list.
	if (isLoading || (isRunScoped && projectId === undefined)) {
		return <IssueResultsTableLoading />;
	}

	if (error) return <IssueResultsTableError error={error} />;

	if (!results.length) return <IssueResultsTableEmpty />;

	return <IssueResultsTable table={table} />;
}

/**
 * Run-scoped wrapper. A plain alias would make `runId` optional at every run
 * call site, where it never is — the run *is* the scope.
 */
export function RunIssueResults(
	props: IssueResultsProps & { runId: number | string }
) {
	return <IssueResults {...props} />;
}
