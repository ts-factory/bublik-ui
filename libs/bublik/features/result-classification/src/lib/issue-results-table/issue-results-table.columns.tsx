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

				// Every link in the stack is run-scoped, so without a run there is
				// nothing to point at.
				if (rowRunId === undefined) return null;

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
			// The grower: a verdict list is the one thing here with no natural
			// width. Omitting `width` would say the same, but saying it keeps the
			// three columns readable as a set.
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
