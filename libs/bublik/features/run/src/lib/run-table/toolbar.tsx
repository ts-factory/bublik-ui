/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ReactNode, useMemo, useState } from 'react';
import { Table, VisibilityState } from '@tanstack/react-table';
import {
	DndContext,
	DragEndEvent,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors
} from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { analyticsEventNames, trackEvent } from '@/bublik/features/analytics';
import { MergedRun, RunData } from '@/shared/types';
import { toolbarIcon } from '@/bublik/run-utils';
import {
	ButtonTw,
	ColumnCheckmark,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	Icon,
	Separator,
	Tooltip
} from '@/shared/tailwind-ui';

import { useExpandUnexpected } from './hooks';
import { hasUnexpected } from './utils';
import { ColumnId } from './types';
import { useGlobalRequirements } from '../hooks';

function getColumnLabel(columnId: string): string {
	return columnId
		.toLowerCase()
		.replace(/_/g, ' ')
		.replace(/ expected$| unexpected$/i, '')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.trim();
}

function getColumnIcon(columnId: string): ReactNode {
	const id = columnId.toLowerCase();

	if (id.includes('unexpected')) return toolbarIcon['unexpected'];
	if (id.includes('expected')) return toolbarIcon['expected'];
	if (id.includes('abnormal')) return toolbarIcon['abnormal'];

	return null;
}

interface SortableColumnItemProps {
	id: ColumnId;
	checked: boolean;
	onToggle: (checked: boolean) => void;
}

function SortableColumnItem({
	id,
	checked,
	onToggle
}: SortableColumnItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				'flex items-center gap-1.5 rounded py-1 pr-2 text-xs hover:bg-primary-wash',
				isDragging && 'relative z-10 bg-primary-wash shadow-sm'
			)}
		>
			<button
				type="button"
				className="grid h-5 w-5 shrink-0 cursor-grab touch-none place-items-center text-text-menu active:cursor-grabbing"
				aria-label={`Reorder ${getColumnLabel(id)} column`}
				{...attributes}
				{...listeners}
			>
				<Icon name="ThreeDotsVertical" size={20} />
			</button>
			<div
				className={cn('flex flex-1 cursor-pointer items-center gap-2 py-0.5')}
				onClick={() => onToggle(!checked)}
			>
				<ColumnCheckmark checked={checked} />
				<span className="flex flex-1 select-none items-center gap-4">
					{getColumnLabel(id)}
					{getColumnIcon(id)}
				</span>
			</div>
		</div>
	);
}

export interface ToolbarProps {
	table: Table<RunData | MergedRun>;
	defaultColumnVisibility: VisibilityState;
	columnOrder: ColumnId[];
	defaultColumnOrder: ColumnId[];
	onColumnOrderChange: (order: ColumnId[]) => void;
}

export const Toolbar = ({
	table,
	defaultColumnVisibility,
	columnOrder,
	defaultColumnOrder,
	onColumnOrderChange
}: ToolbarProps) => {
	const { resetGlobalRequirements } = useGlobalRequirements();
	const { showUnexpected, expandUnexpected, reset } = useExpandUnexpected({
		table
	});

	const [isOpen, setIsOpen] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
	);

	const sortableColumnIds = useMemo<ColumnId[]>(
		() => columnOrder.filter((id) => id !== ColumnId.Tree),
		[columnOrder]
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = sortableColumnIds.indexOf(active.id as ColumnId);
		const newIndex = sortableColumnIds.indexOf(over.id as ColumnId);
		if (oldIndex === -1 || newIndex === -1) return;

		const reordered = arrayMove(sortableColumnIds, oldIndex, newIndex);

		trackEvent(analyticsEventNames.runTableToolbarColumnReorder, {
			columnId: active.id,
			fromIndex: oldIndex,
			toIndex: newIndex
		});

		onColumnOrderChange([ColumnId.Tree, ...reordered]);
	};

	const handleColumnsOpenChange = (open: boolean) => {
		if (open) {
			trackEvent(analyticsEventNames.runTableToolbarColumnsOpen, {
				source: 'columns_dropdown'
			});
		}

		setIsOpen(open);
	};

	const handleResetState = () => {
		trackEvent(analyticsEventNames.runTableToolbarReset, {
			source: 'toolbar'
		});

		table.setColumnVisibility(defaultColumnVisibility);
		onColumnOrderChange(defaultColumnOrder);
		reset();
		resetGlobalRequirements();

		const rootRowId = table.getCoreRowModel().flatRows?.[0]?.id;
		if (rootRowId) table.setExpanded({ [rootRowId]: true });
	};

	const tableHasUnexpected = useMemo(
		() =>
			table
				.getPreFilteredRowModel()
				.flatRows.map((row) => row.original)
				.some(hasUnexpected),
		[table]
	);

	return (
		<div className="flex gap-3">
			<DropdownMenu open={isOpen} onOpenChange={handleColumnsOpenChange}>
				<DropdownMenuTrigger asChild>
					<ButtonTw size="xss" variant="secondary" state={isOpen && 'active'}>
						<Icon name="DashboardModeColumns" size={20} className="mr-1.5" />
						Columns
						<Icon name="ArrowShortSmall" className="ml-1.5" />
					</ButtonTw>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					className="w-56 rounded-lg"
					onEscapeKeyDown={() => setIsOpen(false)}
					onInteractOutside={() => setIsOpen(false)}
					loop
					align="start"
				>
					<DropdownMenuLabel className="text-xs">Columns</DropdownMenuLabel>
					<Separator className="h-px my-1 -mx-1" />
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={sortableColumnIds}
							strategy={verticalListSortingStrategy}
						>
							{sortableColumnIds.map((id) => {
								const column = table.getColumn(id);
								if (!column) return null;

								return (
									<SortableColumnItem
										key={id}
										id={id}
										checked={column.getIsVisible()}
										onToggle={(isVisible) => {
											trackEvent(
												analyticsEventNames.runTableToolbarColumnVisibilityToggle,
												{ columnId: id, visible: isVisible }
											);

											column.toggleVisibility(isVisible);
										}}
									/>
								);
							})}
						</SortableContext>
					</DndContext>
				</DropdownMenuContent>
			</DropdownMenu>
			<Tooltip content="Preview rows containing not expected results">
				<ButtonTw
					variant="secondary"
					state={!tableHasUnexpected ? 'disabled' : 'default'}
					size="xss"
					onClick={() => {
						trackEvent(analyticsEventNames.runTableToolbarPreviewNok, {
							hasUnexpected: tableHasUnexpected
						});

						showUnexpected();
					}}
				>
					<Icon name="EyeShow" size={20} className="mr-1.5" />
					Preview NOK
				</ButtonTw>
			</Tooltip>
			<Tooltip content="Open rows containing not expected resutls">
				<ButtonTw
					variant="secondary"
					state={!tableHasUnexpected ? 'disabled' : 'default'}
					size="xss"
					onClick={() => {
						trackEvent(analyticsEventNames.runTableToolbarOpenNok, {
							hasUnexpected: tableHasUnexpected
						});

						expandUnexpected();
					}}
				>
					<Icon name="Scan" size={20} className="mr-1.5" />
					Open NOK
				</ButtonTw>
			</Tooltip>
			<Tooltip content="Reset table to default state">
				<ButtonTw variant="secondary" size="xss" onClick={handleResetState}>
					<Icon
						name="Refresh"
						size={20}
						className="mr-1.5"
						style={{ transform: 'scaleX(-1)' }}
					/>
					Reset
				</ButtonTw>
			</Tooltip>
		</div>
	);
};
