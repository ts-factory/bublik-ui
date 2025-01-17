/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ColumnDef, Row } from '@tanstack/react-table';

import { cn } from '@/shared/tailwind-ui';

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

function shouldShowVerticalLine<T>(row: Row<T>, lineDepth: number): boolean {
	const parentRow = row.getParentRow();
	const parentRowDepth = parentRow?.depth ?? 0;

	let showBetween = false;
	let hasAfter = false;
	const lineParent = row.getParentRows().find((r) => r.depth === lineDepth);
	const leafs = lineParent?.getLeafRows();
	const prev = leafs?.at(leafs.findIndex((r) => r.id === row.id) - 1);
	const next = leafs?.at(leafs.findIndex((r) => r.id === row.id) + 1);

	if (lineDepth + 1 === prev?.depth && lineDepth + 1 === next?.depth) {
		showBetween = true;
	}

	const after = leafs?.slice(leafs.findIndex((r) => r.id === row.id) + 1);
	if (after?.some((r) => r.depth === row.depth - 1)) {
		hasAfter = true;
	}

	return lineDepth >= parentRowDepth || showBetween || hasAfter;
}

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
			header: () => null,
			cell: (cell) => {
				const { row } = cell;
				const depth = row.depth;
				const parentRow = row.getParentRow();
				const canExpand = row.getCanExpand();
				const isExpanded = row.getIsExpanded();
				const onClick = row.getToggleExpandedHandler();

				return (
					<div
						className="h-full w-full"
						style={{
							display: 'grid',
							gridTemplateColumns: `${Array.from({ length: depth })
								.map(() => '28px')
								.join(' ')} ${row.getCanExpand() ? '28px' : '8px'}`,
							alignItems: 'center',
							justifyItems: 'center'
						}}
					>
						{Array.from({ length: depth }).map((_, lineDepth, arr) => {
							const isLast =
								parentRow?.subRows.at(-1)?.id === row.id &&
								lineDepth === arr.length - 1;

							const shouldShow = shouldShowVerticalLine(row, lineDepth);

							return (
								<div
									key={lineDepth}
									className="w-[2px] justify-self-center self-start bg-border-primary"
									style={{
										height: !isLast ? 'calc(100% + 1px)' : '14px',
										gridRow: '1 / -1',
										gridColumnStart: lineDepth + 1,
										gridColumnEnd: lineDepth + 2,
										display: shouldShow ? 'block' : 'none'
									}}
								/>
							);
						})}
						{/* Horizontal line between columns */}
						{depth > 0 && (
							<div
								className="h-[2px] bg-border-primary w-full"
								style={{
									gridColumnStart: depth,
									gridColumnEnd: depth + 3,
									gridRow: '1 / -1',
									justifySelf: 'end',
									width: `calc(100% - 15px)`,
									alignSelf: 'self-start',
									marginTop: '12px'
								}}
							/>
						)}

						{/* Vertical line below button when expanded */}
						{isExpanded && canExpand && (
							<div
								className="bg-border-primary w-[2px] h-1/2 self-end"
								style={{
									gridColumn: depth + 1,
									gridRow: '1 / -1',
									transform: 'translateY(1px)'
								}}
							/>
						)}
						{/* Expand button or endpoint */}
						{canExpand ? (
							<button
								onClick={onClick}
								className={cn(
									'flex items-center justify-center size-6 rounded border',
									isExpanded
										? 'bg-gray-100 border-gray-300 hover:bg-gray-50'
										: 'bg-bg-ok text-white border-bg-ok'
								)}
								style={{ gridColumn: depth + 1, gridRow: 1, zIndex: 1 }}
							>
								{isExpanded ? '-' : '+'}
							</button>
						) : null}
					</div>
				);
			},
			meta: { className: 'p-0 h-full align-middle w-[1px]' }
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
				const level = cell.getValue<LogTableData['level']>();

				return (
					<span className="inline-flex items-center text-[0.75rem] font-medium transition-colors whitespace-nowrap">
						{level}
					</span>
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
