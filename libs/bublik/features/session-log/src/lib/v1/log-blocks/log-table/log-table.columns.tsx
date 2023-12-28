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

				if (!row.getCanExpand()) return null;

				const isExpanded = row.getIsExpanded();
				const onClick = row.getToggleExpandedHandler();

				return (
					<ButtonTw
						variant="outline"
						size="xss"
						className={cn(
							'px-2.5',
							isExpanded
								? 'hover:bg-gray-100 bg-white'
								: 'bg-bg-ok text-white hover:bg-bg-ok hover:text-white border-transparent'
						)}
						onClick={onClick}
					>
						{isExpanded ? '-' : '+'}
					</ButtonTw>
				);
			},
			meta: { className: 'whitespace-nowrap p-1 text-center' }
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
			meta: { className: 'whitespace-nowrap' }
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
