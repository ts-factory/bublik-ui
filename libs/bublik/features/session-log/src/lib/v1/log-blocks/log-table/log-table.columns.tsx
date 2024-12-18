/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef } from '@tanstack/react-table';

import { ButtonTw, cn } from '@/shared/tailwind-ui';

import {
	GetBlocksMap,
	LogJsonTimestamp,
	LogTableBlock,
	LogTableData
} from '@/shared/types';
import {
	BlockLogContentText,
	BlockLogContentChart,
	BlockLogContentFile,
	BlockLogContentMemoryDump,
	BlockLogContentPacketSniffer
} from './blocks';
import { useLogTableContext } from './log-table.context';
import { TimestampDelta } from './timestamp-delta';
import { Fragment } from 'react/jsx-runtime';

const blocksMap: GetBlocksMap<
	LogTableBlock['data'][number]['log_content'][number]
> = {
	'te-log-table-content-text': BlockLogContentText,
	'te-log-table-content-mi': BlockLogContentChart,
	'te-log-table-content-file': BlockLogContentFile,
	'te-log-table-content-memory-dump': BlockLogContentMemoryDump,
	'te-log-table-content-packet-sniffer': BlockLogContentPacketSniffer
};

const LineNumber = (props: { lineNumber: number; id?: string }) => {
	const context = useLogTableContext();

	return (
		<button
			onClick={() =>
				context?.onLineNumberClick?.(props.id || '1', props.lineNumber)
			}
			className="text-primary hover:underline"
		>
			{props.lineNumber}
		</button>
	);
};

export const LOG_COLUMNS = {
	expand: 'EXPAND',
	lineNumber: 'LINE_NUMBER',
	level: 'LEVEL',
	entityName: 'ENTITY_NAME',
	userName: 'USER_NAME',
	timestamp: 'TIMESTAMP',
	logContent: 'LOG_CONTENT'
} as const;

export const allLogColumns = Object.values(LOG_COLUMNS);

export interface GetColumnsParams {
	showTimestampDelta?: boolean;
}

export const getColumns = (
	params: GetColumnsParams
): ColumnDef<LogTableBlock['data'][number]>[] => {
	const { showTimestampDelta } = params;

	return [
		{
			id: LOG_COLUMNS.expand,
			header: () => <div className="grid items-center w-8 h-8">+</div>,
			cell: (cell) => {
				const { row } = cell;
				const depth = row.depth;
				const parentRow = row.getParentRow();
				const canExpand = row.getCanExpand();
				const isExpanded = row.getIsExpanded();
				const onClick = row.getToggleExpandedHandler();

				const getIndentationForDepth = (level: number) => {
					return 18 + level * 28;
				};

				return (
					<div
						className="h-full w-full pl-1.5"
						style={{
							display: 'grid',
							gridTemplateColumns: `repeat(${depth + 1}, 32px)`,
							gap: '8px',
							alignItems: 'center',
							justifyItems: 'center'
						}}
					>
						{Array.from({ length: depth }).map((_, index, arr) => {
							const isLast =
								parentRow?.subRows.at(-1)?.id === row.id &&
								index === arr.length - 1;

							return (
								<div
									key={index}
									className="w-[2px] h-full bg-gray-300 relative justify-self-center"
								/>
							);
						})}
						{/* {depth > 0 && <div className="h-[2px] bg-gray-300 w-full" />} */}

						{/* Vertical line below button when expanded */}
						{isExpanded && canExpand && (
							<div
								className="bg-gray-300 w-[2px] h-1/2 self-end"
								style={{
									gridColumn: depth + 1,
									gridRow: '1 / -1', // Span all rows
									zIndex: 0
								}}
							/>
						)}
						{/* Expand button or endpoint */}
						{canExpand ? (
							<button
								onClick={onClick}
								className={cn(
									'flex items-center justify-center size-6 rounded relative',
									'border border-gray-300 bg-white hover:bg-gray-50',
									isExpanded && 'bg-gray-100'
								)}
								style={{
									gridColumn: depth + 1,
									gridRow: 1,
									zIndex: 1
								}}
							>
								{isExpanded ? '-' : '+'}
							</button>
						) : null}
					</div>
				);
			},
			meta: { className: 'p-0 h-full relative align-middle' }
		},
		{
			id: LOG_COLUMNS.lineNumber,
			header: 'No.',
			accessorKey: 'line_number',
			cell: (cell) => {
				const lineNumber = cell.getValue<number>();

				return (
					<LineNumber
						lineNumber={lineNumber}
						id={cell.table.options.meta?.id}
					/>
				);
			},
			meta: { className: 'whitespace-nowrap' }
		},
		{
			id: LOG_COLUMNS.level,
			header: 'Level',
			accessorKey: 'level',
			cell: (cell) => {
				const getLevelBadgeColors = (level: LogTableData['level']) => {
					switch (level) {
						case 'ERROR':
							return 'bg-red-500 text-white';
						case 'WARN':
							return 'bg-orange-500 text-white';
						case 'INFO':
							return 'bg-primary text-white';
						case 'VERB':
							return 'bg-green-500 text-white';
						case 'PACKET':
							return 'bg-purple-500 text-white';
						default:
							return '';
					}
				};

				const level = cell.getValue<LogTableData['level']>();

				return (
					<div className="whitespace-nowrap grid place-items-center">
						<span
							className={cn(
								'inline-flex items-center w-fit py-0.5 px-2 rounded border border-transparent text-[0.75rem] font-medium transition-colors',
								getLevelBadgeColors(level)
							)}
						>
							{level}
						</span>
					</div>
				);
			}
		},
		{
			id: LOG_COLUMNS.entityName,
			header: 'Entity Name',
			accessorKey: 'entity_name',
			meta: { className: 'whitespace-nowrap' }
		},
		{
			id: LOG_COLUMNS.userName,
			header: 'User Name',
			accessorKey: 'user_name',
			meta: { className: 'whitespace-nowrap' }
		},
		{
			id: LOG_COLUMNS.timestamp,
			header: showTimestampDelta ? 'Delta' : 'Timestamp',
			accessorKey: 'timestamp',
			cell: ({ cell, row }) => (
				<TimestampDelta
					row={row}
					data={cell.getValue<LogJsonTimestamp>()}
					showDelta={showTimestampDelta}
				/>
			),
			meta: {
				className: cn('whitespace-nowrap', showTimestampDelta && 'text-right')
			}
		},
		{
			id: LOG_COLUMNS.logContent,
			header: 'Log Content',
			accessorKey: 'log_content',
			cell: (cell) => {
				const logContent = cell.getValue<LogTableData['log_content']>();

				return (
					<>
						{logContent.map((block, idx) => {
							const Component = blocksMap[block.type];

							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-expect-error
							return <Component key={`${block.type}_${idx}`} {...block} />;
						})}
					</>
				);
			}
		}
	];
};
