/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef } from '@tanstack/react-table';

import { RunDataResults, RESULT_TYPE } from '@/shared/types';
import { ResultLinksContainer } from '@/bublik/features/result-links';
import { VerdictList, cn } from '@/shared/tailwind-ui';

import { KeyList } from './key-list';
import { highlightDifferences } from './matcher';
import { useRunTableRowState } from '../hooks';

export interface ResultLinksProps {
	runId: string;
	resultId: number;
	result: RunDataResults;
}

const ResultLinks = ({ runId, resultId, result }: ResultLinksProps) => {
	return (
		<ResultLinksContainer runId={runId} resultId={resultId} result={result} />
	);
};

export const getColumns = (
	runId: string,
	rowId: string,
	data: RunDataResults[]
): ColumnDef<RunDataResults>[] => {
	const parametersDataset = Object.fromEntries(
		data.map((item) => [String(item.result_id), item.parameters])
	);

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
			accessorFn: (data) => data.parameters,
			cell: (cell) => {
				const parameters = cell.getValue<string[]>();
				const referenceDiffRowId =
					// eslint-disable-next-line react-hooks/rules-of-hooks
					useRunTableRowState().rowState[rowId]?.referenceDiffRowId;

				const reference = referenceDiffRowId
					? parametersDataset[referenceDiffRowId]
					: parameters;

				return (
					<ul className="flex gap-1 flex-wrap">
						{highlightDifferences(parameters, reference).map((item, index) => (
							<div
								key={index}
								className={cn(
									'inline-flex items-center w-fit py-0.5 px-2 rounded border border-transparent text-[0.75rem] font-medium transition-colors bg-badge-0',
									item.isDifferent
										? 'bg-primary-wash border-primary'
										: 'bg-badge-1'
								)}
							>
								{item.value}
							</div>
						))}
					</ul>
				);
			}
		}
	];
};
