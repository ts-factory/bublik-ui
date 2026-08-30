/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import {
	ColumnDef,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable
} from '@tanstack/react-table';

import {
	useGetIssueResultsQuery,
	useGetRunIssueResultsQuery
} from '@/services/bublik-api';
import { routes } from '@/router';
import { LinkWithProject } from '@/bublik/features/projects';
import { HistoryLinkContainer } from '@/bublik/features/history-link';
import { ButtonTw, Icon, Skeleton, VerdictList } from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';
import type {
	RESULT_TYPE,
	RunIssueResultRow,
	IssueResultRow
} from '@/shared/types';

import { ClassificationTable } from './classification-table';

/**
 * A run-scoped row has no `run_id` — the run is the scope. An issue-scoped one
 * carries its own, because the same issue is stamped across many runs.
 */
type ResultRow = RunIssueResultRow & { run_id?: number };

interface IssueResultsProps {
	issueId: number;
	projectId?: number;
	/**
	 * The run to scope to. Omit for the issue-wide view, where results are
	 * gathered across every run the issue appears in.
	 */
	runId?: number | string;
}

interface ResultLinksProps {
	runId: number | string;
	row: ResultRow;
}

export function issueResultRunId(
	runId: number | string | undefined,
	row: ResultRow
): number | string | undefined {
	return runId ?? row.run_id;
}

export function issueResultTestPath(row: ResultRow): string {
	return [...row.path, row.name].filter(Boolean).join('/');
}

/**
 * The same vertical link stack the run's result table uses, so a result found
 * through an issue offers the same next steps as one found through the tree.
 *
 * History goes through `HistoryLinkContainer`, which resolves the result's own
 * parameters and the run's anchor date. A link built from the issue alone lands
 * on an empty history page, because an issue is not a query.
 *
 * `path` must be the *full* test path. `getHistorySearch` uses it verbatim as
 * the `testName` query param, and history answers "Test with the specified name
 * was not found" for anything that is not a real test — a package path being
 * exactly that. The run tree gets this right for free (it builds
 * `path = [...parents, test_name]`); this endpoint reports the package chain
 * and the test name separately, so they have to be rejoined here.
 */
function ResultLinks({ runId, row }: ResultLinksProps) {
	return (
		// `secondary` is what `HistoryLinkContainer` already renders as, so Run and
		// Log wear it too. Left as bare anchors they read as a stray pair of links
		// hanging off one filled chip rather than as three peers.
		<ul className="flex flex-col items-start gap-1 py-1">
			<li>
				<ButtonTw asChild variant="secondary" size="xss">
					<LinkWithProject
						to={routes.run({ runId, targetIterationId: row.result_id })}
					>
						<Icon name="Paper" size={20} className="mr-1" />
						Run {runId}
					</LinkWithProject>
				</ButtonTw>
			</li>
			<li>
				<ButtonTw asChild variant="secondary" size="xss">
					<LinkWithProject to={routes.log({ runId, focusId: row.result_id })}>
						<Icon
							name="BoxArrowRight"
							size={20}
							className="grid mr-1 place-items-center"
						/>
						Log
					</LinkWithProject>
				</ButtonTw>
			</li>
			<li>
				<HistoryLinkContainer
					runId={Number(runId)}
					resultId={row.result_id}
					path={issueResultTestPath(row) || undefined}
				/>
			</li>
		</ul>
	);
}

function getColumns(runId?: number | string): ColumnDef<ResultRow, unknown>[] {
	return [
		{
			id: 'links',
			header: 'Actions',
			meta: { className: 'w-[168px]' },
			enableSorting: false,
			cell: ({ row }) => {
				const rowRunId = issueResultRunId(runId, row.original);

				// Every link in the stack is run-scoped, so without a run there is
				// nothing to point at.
				if (rowRunId === undefined) {
					return <span className="text-text-menu">-</span>;
				}

				return <ResultLinks runId={rowRunId} row={row.original} />;
			}
		},
		{
			// One column, not two. The API hands back the package chain and the
			// test name separately, but nobody reads a test's identity in halves —
			// and splitting them left the name in a `w-64` column while its own
			// path sat three columns away.
			id: 'test_path',
			accessorFn: (row) => issueResultTestPath(row),
			header: 'Test Path',
			meta: { className: 'w-96' },
			cell: ({ row }) => {
				const path = issueResultTestPath(row.original);

				return (
					<span className="flex items-center gap-1 font-medium text-text-primary">
						<Icon name="Folder" size={14} className="shrink-0 text-text-menu" />
						<span className="truncate">{path || '-'}</span>
					</span>
				);
			}
		},
		{
			id: 'obtained',
			accessorFn: (row) => row.obtained_result ?? '',
			header: 'Obtained Result',
			enableSorting: false,
			cell: ({ row }) => {
				const { obtained_result, verdicts } = row.original;

				if (!obtained_result) return <span className="text-text-menu">-</span>;

				return (
					<VerdictList
						variant="obtained"
						result={obtained_result as RESULT_TYPE}
						verdicts={verdicts}
						isNotExpected
					/>
				);
			}
		}
	];
}

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
		return (
			<div className="flex flex-col gap-1 p-2">
				{Array.from({ length: 3 }, () => 0).map((_, idx) => (
					<Skeleton key={idx} className="h-10 rounded-md" />
				))}
			</div>
		);
	}

	if (error) return <BublikErrorState error={error} className="py-4" />;

	if (!results.length) {
		return <div className="px-4 py-3 text-sm text-text-menu">No results</div>;
	}

	return (
		<div className="pl-8" data-testid="issue-results">
			<ClassificationTable
				table={table}
				getRowAttributes={(row) => ({
					'data-testid': 'issue-result-row',
					'data-result-id': row.original.result_id
				})}
			/>
		</div>
	);
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
