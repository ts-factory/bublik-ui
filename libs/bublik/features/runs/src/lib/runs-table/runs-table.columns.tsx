/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CellContext, ColumnDef } from '@tanstack/react-table';

import {
	getRunStatusInfo,
	BadgeList,
	BadgeListItem
} from '@/shared/tailwind-ui';
import { RunsData, RunsStatisticData, RUN_STATUS } from '@/shared/types';
import { Tooltip } from '@/shared/tailwind-ui';

import { DatesHeader, ColumnDates, RunLinks, ColumnSummary } from './columns';

const onGlobalFilter =
	(cell: CellContext<RunsData, unknown>) => (badge: BadgeListItem) => {
		const table = cell.table;
		const globalFilter: string[] = table.getState().globalFilter;

		if (globalFilter.includes(badge.payload)) {
			const removedFilter = globalFilter.filter((tag) => tag !== badge.payload);

			table.setGlobalFilter(removedFilter);
		} else {
			const addedFilter = Array.from(new Set([badge.payload, ...globalFilter]));

			table.setGlobalFilter(addedFilter);
		}
	};

export const columns: ColumnDef<RunsData>[] = [
	{
		id: 'runStatus',
		header: () => null,
		accessorKey: 'conclusion',
		cell: (cell) => {
			const { icon, bg, color, label } = getRunStatusInfo(
				cell.getValue<RUN_STATUS>()
			);

			return (
				<Tooltip
					content={`Conclusion: ${label}`}
					side="right"
					align="start"
					sideOffset={10}
				>
					<div
						className={`flex flex-col items-center justify-start w-calc(100%+1px) h-[calc(100%+2px)] pt-3 -translate-y-px -translate-x-px rounded-l ${bg} ${color}`}
					>
						{icon}
					</div>
				</Tooltip>
			);
		},
		enableSorting: false
	},
	{
		header: 'Actions',
		accessorKey: 'id',
		cell: (cell) => <RunLinks runId={cell.getValue<number>()} />,
		enableSorting: false
	},
	{
		header: () => <DatesHeader />,
		id: 'Dates',
		accessorFn: ({ start, finish }) => ({ start, finish }),
		cell: ({ cell }) => {
			const { start, finish } = cell.getValue<{
				start: string;
				finish: string;
			}>();

			return <ColumnDates start={start} end={finish} />;
		},
		enableSorting: false
	},
	{
		id: 'statistics_summary',
		header: 'Statistic summary',
		accessorFn: (data) => ({ stats: data.stats, runId: data.id }),
		cell: (cell) => {
			const { stats, runId } = cell.getValue<{
				stats: RunsStatisticData;
				runId: number;
			}>();

			return (
				<ColumnSummary
					runId={runId}
					totalCount={stats.tests_total}
					totalPlannedPercentage={stats.tests_total_plan_percent}
					expectedCount={stats.tests_total_ok}
					expectedPercentage={stats.tests_total_ok_percent}
					unexpectedCount={stats.tests_total_nok}
					unexpectedPercentage={stats.tests_total_nok_percent}
				/>
			);
		},
		sortingFn: (a, b) =>
			a.original.stats.tests_total_nok - b.original.stats.tests_total_nok
	},
	{
		id: 'important_tags',
		header: 'Important tags',
		accessorFn: (data) => {
			return data.important_tags.map((badge) => ({ payload: badge }));
		},
		cell: (cell) => {
			return (
				<BadgeList
					badges={cell.getValue<BadgeListItem[]>()}
					className="bg-badge-6"
					selectedBadges={cell.table.getState().globalFilter}
					onBadgeClick={onGlobalFilter(cell)}
				/>
			);
		},
		enableSorting: false
	},
	{
		header: 'Metadata',
		accessorFn: (data) => data.metadata.map((badge) => ({ payload: badge })),
		cell: (cell) => {
			return (
				<BadgeList
					badges={cell.getValue<BadgeListItem[]>()}
					className="bg-badge-4"
					selectedBadges={cell.table.getState().globalFilter}
					onBadgeClick={onGlobalFilter(cell)}
				/>
			);
		},
		enableSorting: false
	},
	{
		header: 'Tags',
		accessorFn: (data) => data.relevant_tags.map((tag) => ({ payload: tag })),
		cell: (cell) => {
			return (
				<BadgeList
					badges={cell.getValue<BadgeListItem[]>()}
					selectedBadges={cell.table.getState().globalFilter}
					onBadgeClick={onGlobalFilter(cell)}
				/>
			);
		},
		enableSorting: false
	}
];
