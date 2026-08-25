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

import { useGetRunIssueResultsQuery } from '@/services/bublik-api';
import { routes } from '@/router';
import { LinkWithProject } from '@/bublik/features/projects';
import { HistoryLinkContainer } from '@/bublik/features/history-link';
import { Icon, Skeleton, VerdictList } from '@/shared/tailwind-ui';
import { BublikErrorState } from '@/bublik/features/ui-state';
import type { RESULT_TYPE, RunIssueResultRow } from '@/shared/types';

import { ClassificationTable } from './classification-table';

interface RunIssueResultsProps {
	runId: number | string;
	issueId: number;
	projectId?: number;
}

interface ResultLinksProps {
	runId: number | string;
	row: RunIssueResultRow;
}

/**
 * The same vertical link stack the run's result table uses, so a result found
 * through an issue offers the same next steps as one found through the tree.
 *
 * History goes through `HistoryLinkContainer`, which resolves the result's own
 * test path and parameters. A link built from the issue alone lands on an empty
 * history page, because an issue is not a query.
 */
function ResultLinks({ runId, row }: ResultLinksProps) {
	return (
		<ul className="flex flex-col items-start gap-3 py-1 text-primary text-[0.6875rem] font-semibold leading-[0.875rem]">
			<li className="pl-2">
				<LinkWithProject
					className="flex items-center w-full gap-1"
					to={routes.run({ runId, targetIterationId: row.result_id })}
				>
					<Icon name="Paper" className="size-5" />
					Run {runId}
				</LinkWithProject>
			</li>
			<li className="pl-2">
				<LinkWithProject
					className="flex items-center w-full gap-1"
					to={routes.log({ runId, focusId: row.result_id })}
				>
					<Icon name="BoxArrowRight" className="grid place-items-center" />
					Log
				</LinkWithProject>
			</li>
			<li className="pl-0.5">
				<HistoryLinkContainer
					runId={Number(runId)}
					resultId={row.result_id}
					path={row.path.length ? row.path.join('/') : undefined}
				/>
			</li>
		</ul>
	);
}

function getColumns(
	runId: number | string
): ColumnDef<RunIssueResultRow, unknown>[] {
	return [
		{
			id: 'links',
			header: 'Actions',
			meta: { className: 'w-[168px]' },
			enableSorting: false,
			cell: ({ row }) => <ResultLinks runId={runId} row={row.original} />
		},
		{
			id: 'name',
			accessorFn: (row) => row.name ?? '',
			header: 'Test',
			meta: { className: 'w-64' },
			cell: ({ row }) => (
				<span className="font-medium text-text-primary">
					{row.original.name ?? '-'}
				</span>
			)
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
		},
		{
			id: 'path',
			accessorFn: (row) => row.path.join(' / '),
			header: 'Package',
			meta: { className: 'w-72' },
			cell: ({ row }) => (
				<span className="flex items-center gap-1 text-text-menu">
					<Icon name="Folder" size={14} className="shrink-0" />
					{row.original.path.join(' / ') || '(root)'}
				</span>
			)
		}
	];
}

export function RunIssueResults({
	runId,
	issueId,
	projectId
}: RunIssueResultsProps) {
	// Run-scoped: an unscoped answer is never the one we want, and projectId
	// arrives a render late (it comes from the run details query).
	const { data, isLoading, error } = useGetRunIssueResultsQuery(
		projectId === undefined ? skipToken : { runId, issueId, projectId }
	);

	const results = useMemo(() => data ?? [], [data]);
	const columns = useMemo(() => getColumns(runId), [runId]);

	const table = useReactTable({
		data: results,
		columns,
		getRowId: (row) => String(row.result_id),
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel()
	});

	// projectId undefined => query skipped, so isLoading is false. Keep the
	// skeleton up rather than flashing an empty list.
	if (isLoading || projectId === undefined) {
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
		<div className="pl-8" data-testid="run-issue-results">
			<ClassificationTable
				table={table}
				getRowAttributes={(row) => ({
					'data-testid': 'run-issue-result-row',
					'data-result-id': row.original.result_id
				})}
			/>
		</div>
	);
}
