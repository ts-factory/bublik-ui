/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { ColumnDef } from '@tanstack/react-table';

import { routes } from '@/router';
import { LinkWithProject } from '@/bublik/features/projects';
import { HistoryLinkContainer } from '@/bublik/features/history-link';
import { ButtonTw, Icon, VerdictList } from '@/shared/tailwind-ui';

import type {
	RenderResultPreview,
	ResultRow
} from './issue-results-table.types';
import {
	issueResultRunId,
	issueResultPackagePath,
	issueResultTestName
} from './issue-results-table.utils';

interface ResultLinksProps {
	runId: number | string;
	row: ResultRow;
	renderPreview?: RenderResultPreview;
}

function ResultLinks({ runId, row, renderPreview }: ResultLinksProps) {
	const preview = renderPreview?.(row, runId);

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
				{/* The row *is* a `RunDataResults`, so hand it over rather than an
				    id: passing `resultId` makes the link re-fetch, per row, a result
				    the listing already returned in full. */}
				<HistoryLinkContainer runId={Number(runId)} result={row} />
			</li>
			{preview ? <li>{preview}</li> : null}
		</ul>
	);
}

export function getColumns(
	runId?: number | string,
	renderPreview?: RenderResultPreview
): ColumnDef<ResultRow, unknown>[] {
	return [
		{
			id: 'links',
			header: 'Actions',
			meta: { width: 'max-content', headerClassName: 'pl-9' },
			enableSorting: false,
			cell: ({ row }) => {
				const rowRunId = issueResultRunId(runId, row.original);

				if (rowRunId === undefined) return null;

				return (
					<ResultLinks
						runId={rowRunId}
						row={row.original}
						renderPreview={renderPreview}
					/>
				);
			}
		},
		{
			id: 'test_name',
			accessorFn: (row) => row.path || issueResultTestName(row),
			header: 'Test',
			meta: { width: 'minmax(0, 24rem)' },
			cell: ({ row }) => {
				const name = issueResultTestName(row.original);
				const packagePath = issueResultPackagePath(row.original);

				if (!name) return null;

				return (
					<span
						className="flex flex-col min-w-0"
						title={row.original.path || name}
					>
						<span className="truncate font-medium text-text-primary">
							{name}
						</span>
						{packagePath ? (
							<span className="truncate text-[0.6875rem] text-text-menu">
								{packagePath}
							</span>
						) : null}
					</span>
				);
			}
		},
		{
			id: 'obtained',
			accessorFn: (row) => row.obtained_result?.result_type ?? '',
			header: 'Obtained Result',
			meta: { width: 'minmax(0, 1fr)', headerClassName: 'pl-3' },
			enableSorting: false,
			cell: ({ row }) => {
				const { obtained_result, has_error } = row.original;

				if (!obtained_result?.result_type) return null;

				return (
					<VerdictList
						variant="obtained"
						result={obtained_result.result_type}
						verdicts={obtained_result.verdicts}
						isNotExpected={has_error}
					/>
				);
			}
		}
	];
}
