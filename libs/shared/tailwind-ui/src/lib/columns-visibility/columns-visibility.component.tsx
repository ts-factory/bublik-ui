/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { CSSProperties, ReactNode, useState } from 'react';
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
import { GripVertical } from 'lucide-react';

import { cn } from '../utils';
import { ButtonTw } from '../button';
import { ColumnCheckmark } from '../checkbox';
import { Icon, IconProps } from '../icon';
import { Separator } from '../separator';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger
} from '../dropdown';

export type ColumnVisibilityItem = {
	/** Stable id used both as the React key and the dnd-kit sortable id. */
	id: string;
	label: ReactNode;
	/** Trailing status icon (e.g. expected/unexpected/abnormal). */
	icon?: ReactNode;
	checked: boolean;
};

export type ColumnReorderChange = {
	activeId: string;
	fromIndex: number;
	toIndex: number;
};

export interface ColumnsVisibilityProps {
	items: ColumnVisibilityItem[];
	onColumnToggle: (id: string, checked: boolean) => void;
	/** Enables drag-to-reorder with a grip handle. Defaults to `false`. */
	sortable?: boolean;
	/** Called with the new id order after a drag. Required when `sortable`. */
	onReorder?: (orderedIds: string[], change: ColumnReorderChange) => void;
	/** Optional controlled open state. */
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Heading rendered above the column list. Defaults to "Columns". */
	label?: ReactNode;
	triggerLabel?: ReactNode;
	/** Leading trigger icon. Pass `null` to omit it. Defaults to "DashboardModeColumns". */
	triggerIconName?: IconProps['name'] | null;
	align?: 'start' | 'center' | 'end';
	contentClassName?: string;
	/** Extra section rendered at the top of the dropdown, before the column list. */
	children?: ReactNode;
}

export function ColumnsVisibility({
	items,
	onColumnToggle,
	sortable = false,
	onReorder,
	open: controlledOpen,
	onOpenChange,
	label = 'Columns',
	triggerLabel = 'Columns',
	triggerIconName = 'DashboardModeColumns',
	align = 'start',
	contentClassName,
	children
}: ColumnsVisibilityProps) {
	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
	);

	function handleOpenChange(next: boolean) {
		setInternalOpen(next);
		onOpenChange?.(next);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		const ids = items.map((item) => item.id);
		const oldIndex = ids.indexOf(active.id as string);
		const newIndex = ids.indexOf(over.id as string);

		if (oldIndex === -1 || newIndex === -1) return;

		onReorder?.(arrayMove(ids, oldIndex, newIndex), {
			activeId: active.id as string,
			fromIndex: oldIndex,
			toIndex: newIndex
		});
	}

	const list = sortable ? (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={items.map((item) => item.id)}
				strategy={verticalListSortingStrategy}
			>
				{items.map((item) => (
					<SortableColumnItem
						key={item.id}
						item={item}
						onToggle={(checked) => onColumnToggle(item.id, checked)}
					/>
				))}
			</SortableContext>
		</DndContext>
	) : (
		items.map((item) => (
			<ColumnVisibilityRow
				key={item.id}
				item={item}
				onToggle={(checked) => onColumnToggle(item.id, checked)}
			/>
		))
	);

	return (
		<DropdownMenu open={open} onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger asChild>
				<ButtonTw variant="secondary" size="xss" state={open && 'active'}>
					{triggerIconName ? (
						<Icon name={triggerIconName} size={20} className="mr-1.5" />
					) : null}
					{triggerLabel}
					<Icon name="ArrowShortSmall" className="ml-1.5" />
				</ButtonTw>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align={align}
				collisionPadding={{ right: 15 }}
				className={cn('w-56', contentClassName)}
				onEscapeKeyDown={() => handleOpenChange(false)}
				onInteractOutside={() => handleOpenChange(false)}
			>
				{children}
				<DropdownMenuLabel className="text-xs">{label}</DropdownMenuLabel>
				<Separator className="h-px my-1 -mx-1" />
				{list}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

interface ColumnVisibilityRowProps {
	item: ColumnVisibilityItem;
	onToggle: (checked: boolean) => void;
	dragHandle?: ReactNode;
	isDragging?: boolean;
}

function ColumnVisibilityRow({
	item,
	onToggle,
	dragHandle,
	isDragging
}: ColumnVisibilityRowProps) {
	return (
		<div
			className={cn(
				'flex items-center gap-1.5 rounded py-1 pl-1 pr-2 text-xs hover:bg-primary-wash',
				dragHandle ? '' : 'pl-2',
				isDragging && 'relative z-10 bg-primary-wash shadow-sm'
			)}
		>
			{dragHandle}
			<div
				className="flex flex-1 cursor-pointer items-center gap-2 py-0.5"
				onClick={() => onToggle(!item.checked)}
			>
				<ColumnCheckmark checked={item.checked} />
				<span className="flex flex-1 select-none items-center gap-1.5">
					{item.label}
					{item.icon ? (
						<span className="ml-auto inline-flex">{item.icon}</span>
					) : null}
				</span>
			</div>
		</div>
	);
}

interface SortableColumnItemProps {
	item: ColumnVisibilityItem;
	onToggle: (checked: boolean) => void;
}

function SortableColumnItem({ item, onToggle }: SortableColumnItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging
	} = useSortable({ id: item.id });

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition
	};

	return (
		<div ref={setNodeRef} style={style}>
			<ColumnVisibilityRow
				item={item}
				onToggle={onToggle}
				isDragging={isDragging}
				dragHandle={
					<button
						type="button"
						className="grid h-5 w-5 shrink-0 cursor-grab touch-none place-items-center rounded text-text-menu transition-colors hover:bg-[hsl(218_100%_92%)] active:cursor-grabbing"
						aria-label="Reorder column"
						{...attributes}
						{...listeners}
					>
						<GripVertical size={14} />
					</button>
				}
			/>
		</div>
	);
}
