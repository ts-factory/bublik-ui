/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties, Fragment } from 'react';
import { Cell, flexRender, Row } from '@tanstack/react-table';
import {
	SortableContext,
	horizontalListSortingStrategy,
	useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/shared/tailwind-ui';
import { MergedRun, NodeEntity, RunData } from '@/shared/types';

import { ResultTableContainer } from '../../../result-table';
import { ColumnId } from '../../types';
import { useMeasure } from 'react-use';

const noLayoutAnimation = () => false;

/** Transform that follows the active group drag via the shared CSS variable. */
const GROUP_MEMBER_TRANSFORM = 'translate3d(var(--rt-group-dx, 0px), 0, 0)';

export interface RowProps {
	row: Row<RunData | MergedRun>;
	runId: string | string[];
	sortableColumnIds: ColumnId[];
	/** Columns of the group currently being dragged (slide together). */
	draggingGroupColumns: ColumnId[] | null;
	targetIterationId?: number;
}

export const RunRow = ({
	row,
	runId,
	sortableColumnIds,
	draggingGroupColumns,
	targetIterationId
}: RowProps) => {
	const groupMembers = draggingGroupColumns
		? new Set(draggingGroupColumns)
		: null;
	const isExpanded = row.getIsExpanded();
	const isTest = row.original?.type === NodeEntity.Test;
	const isExpandedTest = isTest && isExpanded;
	const [ref, { height }] = useMeasure<HTMLTableRowElement>();

	return (
		<Fragment>
			<tr
				className={cn(
					'[&>*]:hover:bg-gray-50 h-full relative',
					isExpandedTest &&
						'[&>*]:bg-gray-50 h-full [&>*]:sticky [&>*]:top-[102px]'
				)}
				ref={ref}
			>
				<SortableContext
					items={sortableColumnIds}
					strategy={horizontalListSortingStrategy}
				>
					{row.getVisibleCells().map((cell) => {
						const parentIndex = cell.column.parent?.columns?.findIndex(
							(c) => c.id === cell.column.id
						);

						const isLast =
							cell.column.parent?.columns?.length ?? 0 - 1 === parentIndex;

						const className = cn(
							'px-2 py-0 bg-white z-10',
							isLast && 'border-r',
							cell.column.columnDef.meta?.className
						);

						if (cell.column.id === ColumnId.Tree) {
							return (
								<td key={cell.id} className={className}>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							);
						}

						return (
							<DragAlongCell
								key={cell.id}
								cell={cell}
								className={className}
								isGroupMember={
									groupMembers?.has(cell.column.id as ColumnId) ?? false
								}
							/>
						);
					})}
				</SortableContext>
			</tr>
			{row.getIsExpanded() && row.original?.type === NodeEntity.Test ? (
				<tr role="row">
					<td colSpan={row.getVisibleCells().length} className="p-0 bg-white">
						<div style={{ paddingLeft: `${row.depth * 0.8}rem` }}>
							<ResultTableContainer
								runId={runId}
								row={row}
								height={height}
								targetIterationId={targetIterationId}
							/>
						</div>
					</td>
				</tr>
			) : null}
		</Fragment>
	);
};

interface DragAlongCellProps {
	cell: Cell<RunData | MergedRun, unknown>;
	className?: string;
	isGroupMember: boolean;
}

function DragAlongCell({ cell, className, isGroupMember }: DragAlongCellProps) {
	const { setNodeRef, transform, isDragging, isSorting } = useSortable({
		id: cell.column.id,
		animateLayoutChanges: noLayoutAnimation
	});

	const style: CSSProperties = isGroupMember
		? // This column belongs to the group being dragged: slide with the group.
		  {
				transform: GROUP_MEMBER_TRANSFORM,
				transition: 'none',
				opacity: 0.8,
				position: 'relative',
				zIndex: 11
		  }
		: {
				transform: CSS.Translate.toString(transform),
				// Animate only while sorting. Once the drop reorders the data,
				// transition must be off so the transform reset is instant
				// (otherwise the cell slides in from its old offset on drop).
				transition: isSorting && !isDragging ? 'transform 0.2s ease' : 'none',
				opacity: isDragging ? 0.8 : 1,
				// Only position while dragging (to lift via z-index). At idle, leave
				// `position` unset so the sticky class on expanded rows still works.
				...(isDragging ? { position: 'relative', zIndex: 11 } : {})
		  };

	return (
		<td ref={setNodeRef} style={style} className={className}>
			{flexRender(cell.column.columnDef.cell, cell.getContext())}
		</td>
	);
}
