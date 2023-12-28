/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef } from '@tanstack/react-table';

import { HistoryDataAggregation, ResultData } from '@/shared/types';
import { HistoryAggregationColumns } from './history-aggregation.constantst';
import { Badge, BadgeList } from '@/shared/tailwind-ui';

import {
	getParametersHash,
	onBadgeCellClick
} from './history-aggregation.utils';
import { ResultList } from './column-components';
import { HistoryContextMenuContainer } from '../history-context-menu';
import { onResultTypeClick } from '../history-linear/history-linear.utils';
import { HistoryAggregationGlobalFilter } from './history-aggregation.types';

export const columns: ColumnDef<HistoryDataAggregation>[] = [
	{
		id: HistoryAggregationColumns.ResultsLog,
		header: 'Parameters/Hash',
		accessorFn: getParametersHash,
		cell: (cell) => {
			const { parameters, hash } =
				cell.getValue<ReturnType<typeof getParametersHash>>();
			const globalFilter: HistoryAggregationGlobalFilter =
				cell.table.getState().globalFilter;

			return (
				<HistoryContextMenuContainer
					filterKey="parameters"
					label="parameters"
					badges={parameters}
					hash={hash}
				>
					<div className="flex flex-col gap-1">
						<BadgeList
							badges={parameters}
							onBadgeClick={onBadgeCellClick(cell, 'parameters')}
							selectedBadges={globalFilter.parameters}
							className="bg-badge-1"
						/>
						<Badge className="bg-primary-wash">{hash}</Badge>
					</div>
				</HistoryContextMenuContainer>
			);
		}
	},
	{
		id: HistoryAggregationColumns.ParametersHash,
		header: 'Results/Log',
		accessorFn: (data) => data.results_by_verdicts,
		cell: (cell) => {
			const results = cell.getValue<ResultData[]>();
			const globalFilter: HistoryAggregationGlobalFilter =
				cell.table.getState().globalFilter;

			return (
				<ResultList
					results={results}
					onResultClick={onResultTypeClick(cell)}
					onVerdictClick={onBadgeCellClick(cell, 'verdicts')}
					selectedVerdicts={globalFilter.verdicts}
					selectedResultType={{
						resultType: globalFilter.resultType,
						isNotExpected: globalFilter.isNotExpected
					}}
				/>
			);
		}
	}
];
