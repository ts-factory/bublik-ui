/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties, ReactNode, useRef } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
	SortableContext,
	horizontalListSortingStrategy,
	useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

import { flexRender, Header, Table } from '@tanstack/react-table';
import { MergedRun, RunData } from '@/shared/types';
import { TableSort, cn } from '@/shared/tailwind-ui';

import { ColumnId } from '../../types';

export interface RunHeaderProps {
	instance: Table<RunData | MergedRun>;
	columnOrder: ColumnId[];
	/** Columns of the group currently being dragged (slide together). */
	draggingGroupColumns: ColumnId[] | null;
}

const noLayoutAnimation = () => false;

/** Transform that follows the active group drag via the shared CSS variable. */
const GROUP_MEMBER_TRANSFORM = 'translate3d(var(--rt-group-dx, 0px), 0, 0)';

export const RunHeader = ({
	instance,
	columnOrder,
	draggingGroupColumns
}: RunHeaderProps) => {
	const ref = useRef<HTMLTableSectionElement>(null);

	const sortableColumnIds = columnOrder.filter((id) => id !== ColumnId.Tree);
	const groupMembers = draggingGroupColumns
		? new Set(draggingGroupColumns)
		: null;

	return (
		<thead
			ref={ref}
			className={cn(
				'text-left text-[0.6875rem] font-semibold leading-[0.875rem]'
			)}
		>
			{instance.getHeaderGroups().map((headerGroup) => {
				const isLeafRow = headerGroup.headers.every(
					(header) => header.column.columns.length === 0
				);

				if (isLeafRow) {
					return (
						<tr key={headerGroup.id} className="h-8.5">
							<SortableContext
								items={sortableColumnIds}
								strategy={horizontalListSortingStrategy}
							>
								{headerGroup.headers.map((header, idx, arr) =>
									header.column.id === ColumnId.Tree ? (
										<RunHeaderCell
											key={header.id}
											header={header}
											isLast={arr.length - 1 === idx}
										/>
									) : (
										<SortableHeaderCell
											key={header.id}
											header={header}
											isLast={arr.length - 1 === idx}
											isGroupMember={
												groupMembers?.has(header.column.id as ColumnId) ?? false
											}
										/>
									)
								)}
							</SortableContext>
						</tr>
					);
				}

				return (
					<tr key={headerGroup.id} className="h-8.5">
						{headerGroup.headers.map((header, idx, arr) =>
							// Single-column groups already have a grip on their leaf
							// header, so only multi-column groups get a group grip.
							isTreeGroup(header) || header.getLeafHeaders().length <= 1 ? (
								<RunHeaderCell
									key={header.id}
									header={header}
									isLast={arr.length - 1 === idx}
								/>
							) : (
								<GroupHeaderCell
									key={header.id}
									header={header}
									isLast={arr.length - 1 === idx}
								/>
							)
						)}
					</tr>
				);
			})}
		</thead>
	);
};

function isTreeGroup(header: Header<RunData | MergedRun, unknown>): boolean {
	return header
		.getLeafHeaders()
		.some((leaf) => leaf.column.id === ColumnId.Tree);
}

interface HeaderCellProps {
	header: Header<RunData | MergedRun, unknown>;
	isLast: boolean;
	style?: CSSProperties;
	setNodeRef?: (node: HTMLElement | null) => void;
	dragHandle?: ReactNode;
	isDragging?: boolean;
	isOver?: boolean;
}

function RunHeaderCell({
	header,
	isLast,
	style,
	setNodeRef,
	dragHandle,
	isDragging,
	isOver
}: HeaderCellProps) {
	const content = header.isPlaceholder ? null : header.column.getCanSort() ? (
		<div
			onClick={header.column.getToggleSortingHandler()}
			className={cn(
				'flex gap-1 items-center cursor-pointer select-none hover:bg-primary-wash transition-colors rounded px-1 py-1',
				header.column.getIsSorted() && 'bg-primary-wash'
			)}
		>
			{flexRender(header.column.columnDef.header, header.getContext())}
			<TableSort sortDescription={header.column.getIsSorted()} />
		</div>
	) : (
		flexRender(header.column.columnDef.header, header.getContext())
	);

	return (
		<th
			ref={setNodeRef}
			colSpan={header.colSpan}
			className={cn(
				'group/header px-2 border-b bg-white',
				!isLast && 'border-r border-border-primary',
				isOver && 'ring-2 ring-inset ring-primary',
				header.column.columnDef.meta?.className
			)}
			style={{
				position: 'sticky',
				top: header.depth === 1 ? 35 : header.depth * 17 + 35,
				zIndex: isDragging ? 22 : 20,
				...style
			}}
		>
			{dragHandle ? (
				<div className="flex items-center gap-0.5">
					{dragHandle}
					<div className="flex-1">{content}</div>
				</div>
			) : (
				content
			)}
		</th>
	);
}

const dragHandleClassName =
	'grid h-5 w-4 shrink-0 cursor-grab touch-none place-items-center rounded text-text-menu opacity-0 transition-opacity hover:bg-primary-wash group-hover/header:opacity-100 active:cursor-grabbing';

function SortableHeaderCell({
	header,
	isLast,
	isGroupMember
}: HeaderCellProps & { isGroupMember: boolean }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		isDragging,
		isSorting
	} = useSortable({
		id: header.column.id,
		data: { type: 'column' },
		animateLayoutChanges: noLayoutAnimation
	});

	const style: CSSProperties = isGroupMember
		? // This column belongs to the group being dragged: slide with the group.
		  { transform: GROUP_MEMBER_TRANSFORM, transition: 'none', opacity: 0.8 }
		: {
				transform: CSS.Translate.toString(transform),
				// No transition on the grabbed cell so it tracks the cursor 1:1;
				// other cells animate only while sorting. Once the drop reorders
				// the data, transition must be off so the transform reset is
				// instant (otherwise the column slides in from its old offset).
				transition: isSorting && !isDragging ? 'transform 0.2s ease' : 'none',
				opacity: isDragging ? 0.8 : 1
		  };

	return (
		<RunHeaderCell
			header={header}
			isLast={isLast}
			style={style}
			setNodeRef={setNodeRef}
			isDragging={isDragging || isGroupMember}
			dragHandle={
				<button
					type="button"
					aria-label="Reorder column"
					className={dragHandleClassName}
					{...attributes}
					{...listeners}
				>
					<GripVertical size={14} />
				</button>
			}
		/>
	);
}

function GroupHeaderCell({ header, isLast }: HeaderCellProps) {
	const {
		attributes,
		listeners,
		setNodeRef: setDragRef,
		transform,
		isDragging
	} = useDraggable({ id: header.column.id, data: { type: 'group' } });
	const { setNodeRef: setDropRef, isOver } = useDroppable({
		id: header.column.id,
		data: { type: 'group' }
	});

	const setNodeRef = (node: HTMLElement | null) => {
		setDragRef(node);
		setDropRef(node);
	};

	const style: CSSProperties = {
		// Only translate horizontally so the group preview follows the cursor.
		transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
		opacity: isDragging ? 0.8 : 1
	};

	return (
		<RunHeaderCell
			header={header}
			isLast={isLast}
			style={style}
			setNodeRef={setNodeRef}
			isDragging={isDragging}
			isOver={isOver && !isDragging}
			dragHandle={
				<button
					type="button"
					aria-label="Reorder group"
					className={dragHandleClassName}
					{...attributes}
					{...listeners}
				>
					<GripVertical size={14} />
				</button>
			}
		/>
	);
}
