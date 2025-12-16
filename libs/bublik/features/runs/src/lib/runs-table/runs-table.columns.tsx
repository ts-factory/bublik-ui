/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CellContext, ColumnDef, RowData } from '@tanstack/react-table';

import {
	getRunStatusInfo,
	BadgeList,
	BadgeListItem,
	ConclusionHoverCard,
	TableSort,
	cn
} from '@/shared/tailwind-ui';
import { RunsData, RunsStatisticData, RUN_STATUS } from '@/shared/types';

import { DatesHeader, ColumnDates, RunLinks, ColumnSummary } from './columns';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		className?: string;
		headerClassName?: string;
	}
}

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
			const { icon, bg, color } = getRunStatusInfo(cell.getValue<RUN_STATUS>());

			return (
				<ConclusionHoverCard
					conclusion={cell.getValue<RUN_STATUS>()}
					conclusionReason={cell.row.original.conclusion_reason}
					side="right"
					align="start"
				>
					<div
						className={`flex flex-col items-center justify-start w-full h-full pt-3 rounded-l ${bg} ${color}`}
					>
						{icon}
					</div>
				</ConclusionHoverCard>
			);
		},
		enableSorting: false,
		meta: {
			className: 'w-[24px] p-0 h-full'
		}
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
		header: (header) => (
			<div
				onClick={header.column.getToggleSortingHandler()}
				className={cn(
					'flex items-center gap-2 cursor-pointer',
					header.column.columnDef.meta?.headerClassName
				)}
			>
				<span>Statistic Summary</span>
				<TableSort
					isSorted={!!header.column.getIsSorted()}
					sortDescription={header.column.getIsSorted()}
				/>
			</div>
		),
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
			a.original.stats.tests_total_nok - b.original.stats.tests_total_nok,
		meta: { headerClassName: 'pl-1.5' }
	},
	{
		id: 'important_tags',
		header: 'Important Tags',
		accessorFn: (data) =>
			data.important_tags.map((badge) => ({ payload: badge })),
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
		meta: { headerClassName: 'pl-3' },
		enableSorting: false
	},
	{
		header: 'Metadata',
		accessorFn: (data) => data.metadata.map((badge) => ({ payload: badge })),
		cell: (cell) => {
			return (
				<BadgeList
					badges={cell.getValue<BadgeListItem[]>()}
					className="bg-badge-4 whitespace-nowrap"
					selectedBadges={cell.table.getState().globalFilter}
					onBadgeClick={onGlobalFilter(cell)}
				/>
			);
		},
		enableSorting: false,
		meta: { headerClassName: 'pl-3' }
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
		enableSorting: false,
		meta: { headerClassName: 'pl-3' }
	}
];
