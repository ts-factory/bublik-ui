/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef } from '@tanstack/react-table';

import { HistoryDataLinear, RunResult } from '@/shared/types';
import {
	BadgeList,
	BadgeListItem,
	Icon,
	Tooltip,
	VerdictList,
	VerdictListProps,
	VerdictVariant
} from '@/shared/tailwind-ui';

import { HistoryLinearColumns } from './history-linear.constants';
import {
	getObtainedResult,
	getTags,
	getTime,
	onBadgeClick,
	onResultTypeClick
} from './history-linear.utils';
import { Links, RunTime, RunTimeProps } from './column-components';
import { HistoryLinearGlobalFilter } from './history-linear.types';
import { HistoryContextMenuContainer } from '../history-context-menu';

export const columns: ColumnDef<HistoryDataLinear>[] = [
	{
		id: HistoryLinearColumns.Links,
		header: 'Actions',
		accessorFn: (data) => data,
		cell: (cell) => {
			const data = cell.getValue<HistoryDataLinear>();

			return <Links row={data} />;
		}
	},
	{
		id: HistoryLinearColumns.StartDuration,
		header: () => (
			<div className="flex items-center gap-1.5">
				<Tooltip content="Time zone: Browser's local timezone">
					<Icon
						name="InformationCircleQuestionMark"
						size={16}
						className="text-primary"
					/>
				</Tooltip>
				<span>Start [Duration]</span>
			</div>
		),
		accessorFn: getTime,
		cell: (cell) => {
			const { dateTime, duration } = cell.getValue<RunTimeProps>();

			return <RunTime dateTime={dateTime} duration={duration} />;
		}
	},
	{
		id: HistoryLinearColumns.Metadata,
		header: 'Metadata',
		accessorFn: (data) => data.metadata.map((meta) => ({ payload: meta })),
		cell: (cell) => {
			const metadataBadges = cell.getValue<BadgeListItem[]>();

			return (
				<HistoryContextMenuContainer
					label="metadata"
					filterKey="tags"
					badges={metadataBadges}
				>
					<BadgeList
						badges={metadataBadges}
						selectedBadges={cell.table.getState().globalFilter['tags']}
						onBadgeClick={onBadgeClick(cell, 'tags')}
						className="bg-badge-4"
					/>
				</HistoryContextMenuContainer>
			);
		}
	},
	{
		id: HistoryLinearColumns.Tags,
		header: 'Tags',
		accessorFn: getTags,
		cell: (cell) => {
			const tags = cell.getValue<BadgeListItem[]>();

			return (
				<HistoryContextMenuContainer
					label="tags"
					filterKey="tags"
					badges={tags}
				>
					<BadgeList
						badges={tags}
						selectedBadges={cell.table.getState().globalFilter['tags']}
						onBadgeClick={onBadgeClick(cell, 'tags')}
					/>
				</HistoryContextMenuContainer>
			);
		}
	},
	{
		id: HistoryLinearColumns.ExpectedResults,
		header: 'Expected Results',
		accessorFn: (data) => data.expected_results,
		cell: (cell) => {
			const expectedResults = cell.getValue<RunResult[]>();

			return (
				<>
					{expectedResults.map((result, idx) => (
						<VerdictList
							key={idx}
							variant={VerdictVariant.Expected}
							result={result.result_type}
							verdicts={result.verdicts}
						/>
					))}
				</>
			);
		}
	},
	{
		id: HistoryLinearColumns.ObtainedResults,
		header: 'Obtained Results',
		accessorFn: getObtainedResult,
		cell: (cell) => {
			const { isNotExpected, verdicts, result } =
				cell.getValue<VerdictListProps>();
			const globalFilter: HistoryLinearGlobalFilter =
				cell.table.getState().globalFilter;

			const isResultSelected =
				globalFilter.isNotExpected === isNotExpected &&
				globalFilter.resultType === result;

			return (
				<HistoryContextMenuContainer
					badges={verdicts.map((verdict) => ({ payload: verdict }))}
					label="verdicts"
					filterKey="verdicts"
					resultType={result}
					isNotExpected={isNotExpected}
				>
					<VerdictList
						variant={VerdictVariant.Obtained}
						result={result}
						verdicts={verdicts}
						selectedVerdicts={cell.table.getState().globalFilter['verdicts']}
						onVerdictClick={onBadgeClick(cell, 'verdicts')}
						onResultClick={(resultType) =>
							onResultTypeClick(cell)(resultType, isNotExpected)
						}
						isNotExpected={isNotExpected}
						isResultSelected={isResultSelected}
					/>
				</HistoryContextMenuContainer>
			);
		}
	},
	{
		id: HistoryLinearColumns.Parameters,
		header: 'Parameters',
		accessorFn: (data) => data.parameters.map((param) => ({ payload: param })),
		cell: (cell) => {
			const parameters = cell.getValue<BadgeListItem[]>();

			return (
				<HistoryContextMenuContainer
					badges={parameters}
					label="parameters"
					filterKey="parameters"
				>
					<BadgeList
						badges={parameters}
						selectedBadges={cell.table.getState().globalFilter['parameters']}
						onBadgeClick={onBadgeClick(cell, 'parameters')}
						className="bg-badge-1"
					/>
				</HistoryContextMenuContainer>
			);
		}
	}
];
