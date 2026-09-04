/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ColumnDef } from '@tanstack/react-table';

import { routes } from '@/router';
import { LinkWithProject } from '@/bublik/features/projects';
import { HistoryLinkContainer } from '@/bublik/features/history-link';
import { ButtonTw, Icon, VerdictList } from '@/shared/tailwind-ui';
import type { RESULT_TYPE } from '@/shared/types';

import type { ResultRow } from './issue-results-table.types';
import {
	issueResultRunId,
	issueResultTestPath
} from './issue-results-table.utils';

interface ResultLinksProps {
	runId: number | string;
	row: ResultRow;
}

function ResultLinks({ runId, row }: ResultLinksProps) {
	return (
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

export function getColumns(
	runId?: number | string
): ColumnDef<ResultRow, unknown>[] {
	return [
		{
			id: 'links',
			header: 'Actions',
			meta: { width: 'max-content' },
			enableSorting: false,
			cell: ({ row }) => {
				const rowRunId = issueResultRunId(runId, row.original);

				if (rowRunId === undefined) return null;

				return <ResultLinks runId={rowRunId} row={row.original} />;
			}
		},
		{
			id: 'test_path',
			accessorFn: (row) => issueResultTestPath(row),
			header: 'Test Path',
			meta: { width: 'minmax(0, 24rem)' },
			cell: ({ row }) => {
				const path = issueResultTestPath(row.original);

				if (!path) return null;

				return (
					<span className="block min-w-0 truncate font-medium text-text-primary">
						{path}
					</span>
				);
			}
		},
		{
			id: 'obtained',
			accessorFn: (row) => row.obtained_result ?? '',
			header: 'Obtained Result',
			meta: { width: 'minmax(0, 1fr)' },
			enableSorting: false,
			cell: ({ row }) => {
				const { obtained_result, verdicts } = row.original;

				if (!obtained_result) return null;

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
