/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Fragment, useMemo, useState } from 'react';
import {
	ColumnDef,
	ExpandedState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	RowData,
	useReactTable
} from '@tanstack/react-table';

import { BublikEmptyState } from '@/bublik/features/ui-state';
import { AnalyticsEvent } from '@/shared/types';
import {
	Badge,
	ButtonTw,
	Icon,
	JsonViewer,
	Spinner,
	Tooltip,
	cn
} from '@/shared/tailwind-ui';

import {
	getEventNameBadgeStyle,
	getEventTypeBadgeStyle,
	getPathBadgeStyle,
	normalizeTrackedPath
} from '../admin-analytics-page.utils';
import { parseDetailDate } from '@/shared/utils';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		headerCellClassName?: string;
	}
}

interface AnalyticsEventsTableProps {
	events: AnalyticsEvent[];
	totalCount: number;
	isLoading: boolean;
	isFetching: boolean;
}

const hasEventPayload = (payload: unknown) => {
	if (payload === null || payload === undefined) {
		return false;
	}

	if (Array.isArray(payload)) {
		return payload.length > 0;
	}

	if (typeof payload === 'object') {
		return Object.keys(payload as Record<string, unknown>).length > 0;
	}

	if (typeof payload === 'string') {
		return payload.trim().length > 0;
	}

	return true;
};

const getJsonViewerSource = (
	payload: unknown
): Record<string, unknown> | unknown[] => {
	if (Array.isArray(payload)) {
		return payload;
	}

	if (payload && typeof payload === 'object') {
		return payload as Record<string, unknown>;
	}

	return { value: payload };
};

function AnalyticsEventsTable(props: AnalyticsEventsTableProps) {
	const { events, totalCount, isLoading, isFetching } = props;
	const [expanded, setExpanded] = useState<ExpandedState>({});

	const columns = useMemo<ColumnDef<AnalyticsEvent>[]>(
		() => [
			{
				accessorKey: 'occurred_at',
				header: 'Time',
				cell: ({ row }) => (
					<div className="flex items-center h-full">
						<span className="whitespace-nowrap">
							{parseDetailDate(row.original.occurred_at)}
						</span>
					</div>
				)
			},
			{
				accessorKey: 'event_type',
				header: 'Type',
				cell: ({ row }) => {
					const eventType = row.original.event_type || '-';
					const badgeStyle = getEventTypeBadgeStyle(eventType);

					return (
						<div className="flex items-center h-full">
							<Badge style={badgeStyle}>{eventType}</Badge>
						</div>
					);
				},
				meta: { headerCellClassName: 'pl-4' }
			},
			{
				accessorKey: 'event_name',
				header: 'Name',
				cell: ({ row }) => {
					if (!row.original.event_name) {
						return '-';
					}

					const badgeStyle = getEventNameBadgeStyle(row.original.event_name);

					return (
						<div className="flex h-full items-center">
							<Badge
								className="max-w-[280px] break-all"
								style={badgeStyle}
								overflowWrap
							>
								{row.original.event_name}
							</Badge>
						</div>
					);
				},
				meta: { headerCellClassName: 'pl-4' }
			},
			{
				accessorKey: 'path',
				header: 'Path',
				cell: ({ row }) => {
					if (!row.original.path) {
						return '-';
					}

					const normalizedPath = normalizeTrackedPath(row.original.path);
					const badgeStyle = getPathBadgeStyle(normalizedPath);

					return (
						<div className="flex h-full items-center">
							<Badge
								className="max-w-[320px] break-all"
								style={badgeStyle}
								overflowWrap
							>
								{normalizedPath}
							</Badge>
						</div>
					);
				},
				meta: { headerCellClassName: 'pl-4' }
			},
			{
				accessorKey: 'anon_id',
				header: 'Anon ID',
				cell: ({ row }) => (
					<div className="flex items-center w-full h-full">
						<span className="max-w-[220px] block whitespace-nowrap truncate">
							{row.original.anon_id || '-'}
						</span>
					</div>
				)
			},
			{
				accessorKey: 'app_version',
				header: 'Version',
				cell: ({ row }) => (
					<div className="flex items-center h-full">
						<span className="max-w-[160px] block break-all">
							{row.original.app_version || '-'}
						</span>
					</div>
				)
			},
			{
				id: 'browser',
				header: 'Browser',
				cell: ({ row }) => {
					const browser =
						`${row.original.browser_name} ${row.original.browser_version}`.trim();

					return (
						<div className="flex items-center h-full">
							<span className="max-w-[220px] block break-all">
								{browser || '-'}
							</span>
						</div>
					);
				}
			},
			{
				id: 'payload',
				header: '',
				cell: ({ row }) => {
					if (!row.getCanExpand()) return;

					return (
						<div className="flex items-center h-full justify-end">
							<Tooltip content="Show Event Payload">
								<button
									onClick={row.getToggleExpandedHandler()}
									className={cn(
										'rounded p-1 hover:bg-primary-wash text-primary',
										row.getIsExpanded() &&
											'bg-primary text-white hover:bg-primary hover:text-white'
									)}
								>
									<Icon
										name="ArrowShortTop"
										className={cn(
											'size-5',
											!row.getIsExpanded() && 'rotate-180'
										)}
									/>
								</button>
							</Tooltip>
						</div>
					);
				}
			}
		],
		[]
	);

	const table = useReactTable({
		data: events,
		columns,
		state: { expanded },
		onExpandedChange: setExpanded,
		getRowId: (row) => `${row.id}`,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		getRowCanExpand: (row) => hasEventPayload(row.original.payload)
	});

	if (isLoading) {
		return (
			<div className="h-full grid place-items-center">
				<Spinner className="h-16" />
			</div>
		);
	}

	if (!events.length) {
		return (
			<BublikEmptyState
				title="No analytics events"
				description="Events will appear here after the first tracked actions"
				className="h-full"
				hideIcon
			/>
		);
	}

	return (
		<div className="min-w-[1080px]">
			<table className="w-full p-0 m-0 border-separate border-spacing-0">
				<thead className="text-left text-[0.6875rem] font-semibold leading-[0.875rem]">
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id} className="h-8.5">
							{headerGroup.headers.map((header) => {
								const className =
									header.column.columnDef.meta?.headerCellClassName;

								return (
									<th
										key={header.id}
										className={cn(
											'px-2 border-b border-border-primary bg-white sticky top-9 z-10',
											className
										)}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</th>
								);
							})}
						</tr>
					))}
				</thead>
				<tbody
					className={cn(
						'text-[0.75rem] leading-[1.125rem] font-medium [&>*:not(:last-child)>*]:border-b [&>*:not(:last-child)>*]:border-border-primary',
						isFetching && 'opacity-70'
					)}
				>
					{table.getRowModel().rows.map((row) => (
						<Fragment key={row.id}>
							<tr className="border-b align-top">
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-2 h-8 bg-white align-top">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
							{row.getIsExpanded() ? (
								<tr className="border-b align-top">
									<td
										colSpan={row.getVisibleCells().length}
										className="px-2 py-2 bg-gray-50 border-border-primary"
									>
										<div className="rounded border border-border-primary bg-white p-2">
											<JsonViewer
												src={getJsonViewerSource(row.original.payload)}
											/>
										</div>
									</td>
								</tr>
							) : null}
						</Fragment>
					))}
				</tbody>
			</table>
		</div>
	);
}

export { AnalyticsEventsTable };
