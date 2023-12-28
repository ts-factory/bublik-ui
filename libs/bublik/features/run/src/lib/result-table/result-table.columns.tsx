/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { FC } from 'react';
import { ColumnDef } from '@tanstack/react-table';

import { RunDataResults, RESULT_TYPE } from '@/shared/types';
import { ResultLinksContainer } from '@/bublik/features/result-links';
import { VerdictList, BadgeList } from '@/shared/tailwind-ui';

import { KeyList } from './key-list';

export interface ResultLinksProps {
	runId: string;
	resultId: number;
	result: RunDataResults;
}

const ResultLinks: FC<ResultLinksProps> = ({ runId, resultId, result }) => {
	return (
		<ResultLinksContainer runId={runId} resultId={resultId} result={result} />
	);
};

export const getColumns = (runId: string): ColumnDef<RunDataResults>[] => {
	return [
		{
			header: 'Actions',
			id: 'links',
			accessorFn: (data) => data,
			cell: (cell) => {
				const value = cell.getValue<RunDataResults>();

				return (
					<div className="flex items-center h-full">
						<ResultLinks
							runId={runId}
							resultId={value.result_id}
							result={value}
						/>
					</div>
				);
			}
		},
		{
			header: 'Expected Results',
			accessorFn: (data) => data.expected_result,
			cell: (cell) => {
				const value = cell.getValue<RunDataResults['expected_result']>();

				return (
					<div className="flex flex-col flex-wrap gap-1">
						<VerdictList
							variant="expected"
							verdicts={value.verdict}
							result={value.result_type}
						/>
						{value.key.length ? <KeyList items={value.key} /> : null}
					</div>
				);
			}
		},
		{
			header: 'Obtained Result',
			accessorFn: (data) => ({
				isNotExpected: data.has_error,
				verdicts: data.obtained_result.verdict,
				result: data.obtained_result.result_type
			}),
			cell: (cell) => {
				const value = cell.getValue<{
					isNotExpected: boolean;
					verdicts: string[];
					result: RESULT_TYPE;
				}>();

				return (
					<VerdictList
						variant="obtained"
						verdicts={value.verdicts}
						result={value.result}
						isNotExpected={value.isNotExpected}
					/>
				);
			}
		},
		{
			header: 'Parameters',
			accessorFn: (data) => data.parameters.map((payload) => ({ payload })),
			cell: (cell) => {
				const value = cell.getValue<{ payload: string }[]>();

				return <BadgeList badges={value} className="bg-badge-1" />;
			}
		}
	];
};
