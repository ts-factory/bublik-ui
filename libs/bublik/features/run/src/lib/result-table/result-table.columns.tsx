/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef, createColumnHelper } from '@tanstack/react-table';

import { RunDataResults } from '@/shared/types';
import { ResultLinksContainer } from '@/bublik/features/result-links';
import { Badge, VerdictList, cn } from '@/shared/tailwind-ui';

import { KeyList } from './key-list';
import { highlightDifferences } from './matcher';
import { useRunTableRowState } from '../hooks';

const helper = createColumnHelper<RunDataResults>();

interface GetColumnsOptions {
	rowId: string;
	data: RunDataResults[];
	showLinkToRun?: boolean;
}

export const getColumns = ({
	rowId,
	data,
	showLinkToRun = false
}: GetColumnsOptions) => {
	const parametersDataset = Object.fromEntries(
		data.map((item) => [String(item.result_id), item.parameters])
	);

	return [
		helper.accessor((data) => data, {
			header: 'Actions',
			id: 'links',
			cell: (cell) => {
				const value = cell.getValue();

				return (
					<div className="flex items-center h-full">
						<ResultLinksContainer
							runId={value.run_id}
							resultId={value.result_id}
							result={value}
							showLinkToRun={showLinkToRun}
						/>
					</div>
				);
			}
		}),
		helper.accessor('requirements', {
			header: 'Requirements',
			cell: (cell) => {
				const requirements = cell.getValue();

				if (!requirements) return;

				return (
					<div className="flex flex-col flex-wrap gap-1">
						{requirements.map((requirement) => {
							return (
								<Badge
									key={requirement}
									className="text-start bg-badge-2"
									overflowWrap
								>
									{requirement}
								</Badge>
							);
						})}
					</div>
				);
			}
		}),
		helper.accessor('artifacts', {
			header: 'Artifacts',
			cell: (cell) => {
				const artifacts = cell.getValue();

				if (!artifacts) return;

				return (
					<div className="flex flex-col flex-wrap gap-1">
						{artifacts.map((artifact) => {
							return (
								<Badge
									key={artifact}
									className="text-start bg-badge-16"
									overflowWrap
								>
									{artifact}
								</Badge>
							);
						})}
					</div>
				);
			}
		}),
		helper.accessor('expected_result', {
			header: 'Expected Results',
			cell: (cell) => {
				const value = cell.getValue();

				if (!value) return;

				return (
					<div className="flex flex-col flex-wrap gap-1">
						{value.verdict && value.result_type ? (
							<VerdictList
								variant="expected"
								verdicts={value.verdict}
								result={value.result_type}
							/>
						) : null}
						{value?.key?.length && value.key ? (
							<KeyList items={value.key} />
						) : null}
					</div>
				);
			}
		}),
		helper.accessor(
			(data) => ({
				isNotExpected: data.has_error,
				verdicts: data.obtained_result.verdict,
				result: data.obtained_result.result_type
			}),
			{
				header: 'Obtained Result',
				cell: (cell) => {
					const value = cell.getValue();

          if (!value.result) return;

					return (
						<VerdictList
							variant="obtained"
							verdicts={value.verdicts}
							result={value.result}
							isNotExpected={value.isNotExpected}
						/>
					);
				}

			}
		),
		helper.accessor('parameters', {
			header: 'Parameters',
			cell: (cell) => {
				const parameters = cell.getValue();
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
		})
	] as ColumnDef<RunDataResults>[];
};
