/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentProps, ComponentType, Fragment, useState } from 'react';
import {
	ExpandedState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	OnChangeFn,
	PaginationState,
	Row,
	RowData,
	useReactTable
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { RocketIcon } from '@radix-ui/react-icons';

import { Facility, ImportTaskRow, Severity } from '@/shared/types';
import { useCopyToClipboard } from '@/shared/hooks';
import {
	Badge,
	ButtonTw,
	cn,
	cva,
	Icon,
	Pagination,
	Skeleton,
	toast
} from '@/shared/tailwind-ui';
import { TIME_DOT_FORMAT_FULL } from '@/shared/utils';
import { config } from '@/bublik/config';
import { BublikEmptyState, BublikErrorState } from '@/bublik/features/ui-state';

import {
	columns,
	getBgByStatus,
	getIconByStatus
} from './import-event-table.columns';
import { FACILITY_MAP, SEVERITY_MAP } from '../utils';
import { getSeverityBgColor } from './import-event-table-utils';
import { useImportLog } from './import-log.component';

declare module '@tanstack/react-table' {
	interface ColumnMeta<TData extends RowData, TValue> {
		width?: string;
		className?: string;
	}
}

interface ImportEventTableProps {
	data: ImportTaskRow[];
	pagination: PaginationState;
	setPagination: OnChangeFn<PaginationState>;
	expanded: ExpandedState;
	setExpanded: OnChangeFn<ExpandedState>;
	isScrolled: boolean;
	rowCount: number;
}

function ImportEventTable(props: ImportEventTableProps) {
	const { data, pagination, setPagination, rowCount, expanded, setExpanded } =
		props;

	const table = useReactTable({
		state: { pagination, expanded },
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		onPaginationChange: setPagination,
		onExpandedChange: setExpanded,
		getRowId: (row) => row.celery_task ?? row.run_source_url,
		getRowCanExpand: (row) => row?.original?.event_logs?.length > 0,
		rowCount,
		manualPagination: true
	});

	const gridTemplateColumns = columns
		.map((col) => col.meta?.['width'] || 'minmax(0, 1fr)')
		.join(' ');

	return (
		<div>
			<div className="w-full overflow-hidden">
				<div className="grid" style={{ gridTemplateColumns }}>
					{table.getHeaderGroups().map((headerGroup) => (
						<Fragment key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								const className = header.column.columnDef.meta?.['className'];

								return (
									<div
										key={header.id}
										className={cn(
											'tracking-wider sticky top-0 mb-1 px-1 py-2 text-left text-[0.6875rem] font-semibold leading-[0.875rem] bg-white',
											className
										)}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</div>
								);
							})}
						</Fragment>
					))}

					{table.getRowModel().rows.map((row) => (
						<EventRow key={row.id} row={row} />
					))}
				</div>
			</div>

			<div className="flex items-center justify-center mt-4">
				<Pagination
					totalCount={rowCount}
					pageSize={table.getState().pagination.pageSize}
					onPageChange={(page) => table.setPageIndex(page - 1)}
					onPageSizeChange={table.setPageSize}
					currentPage={table.getState().pagination.pageIndex + 1}
				/>
			</div>
		</div>
	);
}

interface EventRowProps {
	row: Row<ImportTaskRow>;
}

function EventRow({ row }: EventRowProps) {
	const [isHovered, setIsHovered] = useState(false);
	const { toggle } = useImportLog();

	return (
		<Fragment key={row.id}>
			{row.getVisibleCells().map((cell, cellIdx, cells) => {
				const className = cell.column.columnDef.meta?.['className'];

				return (
					<div
						key={cell.id}
						className={cn(
							'px-1 py-2 bg-white text-text-primary whitespace-nowrap text-[0.75rem] leading-[1.125rem] font-medium',
							'flex items-center transition-colors',
							'border-transparent',
							cellIdx !== 0 && 'border-y',
							cellIdx === cells.length - 1 && 'border-r rounded-r',
							!row.getIsExpanded() && 'mb-1',
							row.getCanExpand() && 'cursor-pointer',
							isHovered && 'border-primary',
							className
						)}
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
						onClick={(e) => {
							const node = e.target as HTMLElement;

							if (node.closest('a, button') || !row.getCanExpand()) {
								return;
							}

							row.toggleExpanded();
						}}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</div>
				);
			})}
			{row.getIsExpanded() && (
				<div className={'col-span-full'}>
					{renderEventLogs({
						eventLogs: row.original.event_logs,
						taskId: row.original.celery_task,
						toggle
					})}
				</div>
			)}
		</Fragment>
	);
}

const ImportEventTableLoading = () => {
	return (
		<div className="flex flex-col gap-1 mt-1">
			<Skeleton className="h-10" />
			{Array(25)
				.fill(0)
				.map((_, idx) => (
					<Skeleton key={idx} className="rounded h-[52.5px]" />
				))}
		</div>
	);
};

interface ImportEventTableErrorProps {
	error: unknown;
}

const ImportEventTableError = (props: ImportEventTableErrorProps) => {
	return (
		<BublikErrorState error={props.error} iconSize={48} className="h-screen" />
	);
};

const ImportEventTableEmpty = () => {
	return (
		<BublikEmptyState
			title="No results found"
			description="No results found, please try another search"
			className="h-[calc(100vh-176px)]"
			iconSize={48}
			iconClassName="text-text-unexpected"
		/>
	);
};

interface EventLogsOptions {
	eventLogs: ImportTaskRow['event_logs'];
	taskId?: string | null;
	toggle: ReturnType<typeof useImportLog>['toggle'];
}

function renderEventLogs(props: EventLogsOptions) {
	const { eventLogs, taskId, toggle } = props;
	const orderedEventLogs = eventLogs.slice().reverse();

	return (
		<div className="bg-white px-4 py-8 border-t border-border-primary mb-1">
			<div className="relative flex flex-col gap-8">
				{/* Continuous vertical line */}
				<div className="absolute left-10 top-12 bottom-16 z-10 w-0.5 bg-border-primary" />

				<div className="border relative rounded-md border-border-primary p-4 hover:border-primary transition-colors">
					{taskId ? (
						<div className="flex items-center absolute -top-[15px] px-2 left-[80px] bg-white">
							<span className="text-sm text-text-primary font-semibold">
								Task: &nbsp;
							</span>
							<CopyableTaskId taskId={taskId} />
							<span className="px-2">•</span>
							<div className="flex items-center gap-2">
								<ButtonTw
									variant="secondary"
									size="xss"
									onClick={toggle(taskId)}
								>
									<Icon name="Paper" size={20} className="mr-1.5" />
									<span>Log</span>
								</ButtonTw>
								<ButtonTw
									variant="secondary"
									size="xss"
									className="justify-start"
									asChild
								>
									<a
										href={`${config.oldBaseUrl}/flower/task/${taskId}`}
										target="_blank"
										rel="noreferrer"
									>
										<RocketIcon className="mr-1.5 size-4" />
										<span>Task</span>
									</a>
								</ButtonTw>
							</div>
						</div>
					) : (
						<div className="flex items-center absolute -top-[15px] px-2 left-[80px] bg-white">
							<Badge variant="warning" className="ml-2">
								No celery task available
							</Badge>
							<span className="text-xs text-text-secondary ml-2">
								These events cannot be opened in Flower or have their logs
								viewed
							</span>
						</div>
					)}
					<div className="relative pl-8">
						<div className="space-y-4">
							{orderedEventLogs.map((evt) => {
								const StatusIcon = getEventLogIcon(evt.severity);
								const bg = getEventLogBg(evt.severity);

								return (
									<div key={evt.timestamp + evt.msg} className="relative">
										<div
											className={`absolute -left-[24px] top-[11px] flex size-8 items-center justify-center rounded-full ${bg} text-white z-10`}
										>
											<StatusIcon className="size-6" />
										</div>

										<div className="space-y-3 rounded-lg ml-4 border border-border-primary bg-gray-50/70 p-4">
											<div className="flex flex-col gap-2">
												<div className="flex items-center gap-2">
													<FacilityBadge facility={evt.facility as Facility} />
													<SeverityBadge severity={evt.severity as Severity} />
												</div>
												<div>
													<div className="flex items-center gap-2 text-xs leading-5 text-text-primary flex-wrap">
														<div className="flex items-center gap-1">
															<Icon name="Clock" className="size-4" />
															<span>
																{format(
																	parseISO(evt.timestamp),
																	TIME_DOT_FORMAT_FULL
																)}
															</span>
														</div>
													</div>
												</div>
											</div>
											<p className="font-medium text-xs bg-primary-wash p-4 rounded-md">
												{evt.msg}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

interface CopyableTaskIdProps {
	taskId: string;
}

function CopyableTaskId({ taskId }: CopyableTaskIdProps) {
	const [, copy] = useCopyToClipboard();

	return (
		<button
			type="button"
			className="inline-flex items-center gap-1 text-sm text-gray-800 whitespace-pre-wrap group hover:text-primary"
			onClick={(event) => {
				event.stopPropagation();
				copy(taskId).then((success) => {
					if (success) {
						toast.success('Copied task id to clipboard');
					} else {
						toast.error('Failed to copy task id');
					}
				});
			}}
		>
			<code>{taskId}</code>
			<Icon
				name="PaperStack"
				size={14}
				className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
			/>
		</button>
	);
}

function getEventLogBg(severity: string): string {
	switch (severity) {
		case Severity.ERROR:
			return 'bg-bg-error';
		case Severity.WARNING:
			return 'bg-yellow-500';
		case Severity.DEBUG:
			return 'bg-gray-500';
		case Severity.INFO:
		default:
			return 'bg-primary';
	}
}

type EventLogIconProps = Omit<ComponentProps<typeof Icon>, 'name'>;

function getEventLogIcon(severity: string): ComponentType<EventLogIconProps> {
	switch (severity) {
		case Severity.ERROR:
			return (props: EventLogIconProps) => (
				<Icon {...props} name="InformationCircleCrossMark" />
			);
		case Severity.WARNING:
			return (props: EventLogIconProps) => (
				<Icon {...props} name="TriangleExclamationMark" />
			);
		case Severity.DEBUG:
			return (props: EventLogIconProps) => <Icon {...props} name="IssueIcon" />;
		case Severity.INFO:
		default:
			return (props: EventLogIconProps) => (
				<Icon {...props} name="InformationCircleCheckmark" />
			);
	}
}

const facilityStyles = cva({
	base: [
		'inline-flex',
		'items-center',
		'w-fit',
		'py-0.5',
		'px-2',
		'rounded',
		'border',
		'border-transparent',
		'leading-[1.125rem]',
		'text-[0.75rem]',
		'font-medium',
		'transition-colors'
	],
	variants: {
		variant: {
			[Facility.ImportRuns]: ['bg-blue-100', 'text-blue-800'],
			[Facility.MetaCaterigozation]: ['bg-purple-100', 'text-purple-800'],
			[Facility.AddTags]: ['bg-green-100', 'text-green-800'],
			[Facility.Celery]: ['bg-amber-100', 'text-amber-800']
		}
	}
});

function formatRuntime(seconds: number): string {
	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = (seconds % 60).toFixed(2);

	const parts = [];
	if (hrs > 0) parts.push(`${hrs}h`);
	if (mins > 0) parts.push(`${mins}m`);
	parts.push(`${secs}s`);

	return parts.join(' ');
}

interface FacilityBadgeProps {
	facility: Facility;
}

function FacilityBadge(props: FacilityBadgeProps) {
	if (!props.facility) return null;

	const facility = FACILITY_MAP.has(props.facility)
		? FACILITY_MAP.get(props.facility)
		: props.facility;

	return (
		<span className={facilityStyles({ variant: props.facility })}>
			{facility?.toUpperCase()}
		</span>
	);
}

interface SeverityBadgeProps {
	severity: Severity;
}

function SeverityBadge(props: SeverityBadgeProps) {
	const { severity } = props;
	return (
		<Badge className={getSeverityBgColor(severity)}>
			{SEVERITY_MAP.has(severity)
				? SEVERITY_MAP.get(severity)?.toUpperCase()
				: severity.toUpperCase()}
		</Badge>
	);
}

export const statusBadgeStyles = cva({
	base: [
		'inline-flex',
		'w-fit',
		'px-2 py-0.5',
		'text-xs',
		'leading-5',
		'rounded',
		'items-center'
	],
	variants: {
		variant: {
			SUCCESS: ['bg-badge-3', 'text-text-expected'],
			FAILURE: ['bg-badge-12', 'text-white'],
			RUNNING: ['bg-primary', 'text-white'],
			RECEIVED: ['bg-badge-0', 'text-text-secondary'],
			UNKNOWN: ['bg-badge-0', 'text-text-primary']
		}
	},
	defaultVariants: {
		variant: 'UNKNOWN'
	}
});

interface StatusBadgeProps extends ComponentProps<'div'> {
	status: string;
}

function StatusBadge({ status, className, ...rest }: StatusBadgeProps) {
	return (
		<div
			className={cn(statusBadgeStyles({ variant: status as any }), className)}
			{...rest}
		>
			{status}
		</div>
	);
}

export {
	ImportEventTable,
	ImportEventTableEmpty,
	ImportEventTableLoading,
	ImportEventTableError,
	FacilityBadge,
	StatusBadge
};
