/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef } from '@tanstack/react-table';

import { RunDataResults } from '@/shared/types';
import { ResultLinksContainer } from '@/bublik/features/result-links';

import { RunDataResultsWithDiff } from './result-diff.utils';
import { Gutter } from '../gutter';
import { ObtainedResultDiff } from '../obtained-result-diff';
import { ParametersDiff } from '../parameters-diff';

export interface ResultLinksProps {
	runId: string;
	resultId: number;
	result: RunDataResults;
}

export const getColumns = (
	leftRunId: string,
	rightRunId: string
): ColumnDef<RunDataResultsWithDiff>[] => {
	return [
		{
			id: 'GUTTER_LEFT',
			cell: (cell) => (
				<div className="flex items-center h-full">
					<Gutter diffType={cell.row.original.diffType} />
				</div>
			)
		},
		{
			id: 'ACTIONS_LEFT',
			header: 'Actions',
			accessorFn: (data) => data.left,
			cell: (cell) => {
				const data = cell.getValue<RunDataResults | null>();

				if (!data) return null;

				return (
					<div className="flex items-center h-full">
						<ResultLinksContainer
							runId={leftRunId}
							resultId={data.result_id}
							result={data}
						/>
					</div>
				);
			}
		},
		{
			id: 'OBTAINED_RESULT_LEFT',
			header: 'Obtained Result',
			accessorFn: (data) => data,
			cell: (cell) => {
				const { left, right } = cell.getValue<RunDataResultsWithDiff>();
				const leftResultType = left?.obtained_result.result_type;
				const leftVerdicts = left?.obtained_result.verdicts;
				const leftIsNotExpected = left?.has_error;

				const rightResultType = right?.obtained_result.result_type;
				const rightVerdicts = right?.obtained_result.verdicts;
				const rightIsNotExpected = right?.has_error;

				return (
					<ObtainedResultDiff
						side="left"
						leftResultType={leftResultType}
						leftIsNotExpected={leftIsNotExpected}
						leftVerdicts={leftVerdicts}
						rightResultType={rightResultType}
						rightIsNotExpected={rightIsNotExpected}
						rightVerdicts={rightVerdicts}
					/>
				);
			}
		},
		{
			id: 'PARAMETERS_LEFT',
			header: 'Parameters',
			accessorFn: (data) => data,
			cell: (cell) => {
				const { left, right } = cell.getValue<RunDataResultsWithDiff>();

				return (
					<ParametersDiff
						side="left"
						left={left?.parameters}
						right={right?.parameters}
					/>
				);
			}
		},
		{
			id: 'GUTTER_RIGHT',
			cell: (cell) => (
				<div className="flex items-center h-full">
					<Gutter diffType={cell.row.original.diffType} />
				</div>
			)
		},
		{
			id: 'ACTIONS_RIGHT',
			header: 'Actions',
			accessorFn: (data) => data.right,
			cell: (cell) => {
				const data = cell.getValue<RunDataResults | null>();

				if (!data) return null;

				return (
					<div className="flex items-center h-full">
						<ResultLinksContainer
							runId={rightRunId}
							resultId={data.result_id}
							result={data}
						/>
					</div>
				);
			}
		},
		{
			id: 'OBTAINED_RESULT_RIGHT',
			header: 'Obtained Result',
			accessorFn: (data) => data,
			cell: (cell) => {
				const { left, right } = cell.getValue<RunDataResultsWithDiff>();
				const leftResultType = left?.obtained_result.result_type;
				const leftVerdicts = left?.obtained_result.verdicts;
				const leftIsNotExpected = left?.has_error;

				const rightResultType = right?.obtained_result.result_type;
				const rightVerdicts = right?.obtained_result.verdicts;
				const rightIsNotExpected = right?.has_error;

				return (
					<ObtainedResultDiff
						side="right"
						leftResultType={leftResultType}
						leftIsNotExpected={leftIsNotExpected}
						leftVerdicts={leftVerdicts}
						rightResultType={rightResultType}
						rightIsNotExpected={rightIsNotExpected}
						rightVerdicts={rightVerdicts}
					/>
				);
			}
		},
		{
			id: 'PARAMETERS_RIGHT',
			header: 'Parameters',
			accessorFn: (data) => data,
			cell: (cell) => {
				const { left, right } = cell.getValue<RunDataResultsWithDiff>();

				return (
					<ParametersDiff
						side="right"
						left={left?.parameters}
						right={right?.parameters}
					/>
				);
			}
		}
	];
};
