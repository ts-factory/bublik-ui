/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef, ReactNode } from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';

import { cn, cva } from '../utils';

const itemMenuStyles = cva({
	base: [
		'group transition-colors',
		'flex cursor-default select-none items-center rounded-md px-2 py-2 text-xs outline-none gap-2',
		'text-gray-400 focus:bg-primary-wash'
	]
});

export const ContextMenuItem = forwardRef<
	HTMLDivElement,
	ContextMenuPrimitive.MenuItemProps & {
		icon?: ReactNode;
		label: string;
		shortcut?: string;
	}
>(({ label, icon, shortcut, ...props }, ref) => {
	return (
		<ContextMenuPrimitive.Item
			{...props}
			className={cn(itemMenuStyles(), props.className)}
			ref={ref}
		>
			<div className="grid transition-colors place-items-center text-text-menu group-focus:text-primary">
				{icon}
			</div>
			<span className="flex-grow transition-colors text-text-primary group-rdx-disabled:text-text-menu group-focus:text-primary">
				{label}
			</span>
			{shortcut && <span className="text-xs">{shortcut}</span>}
		</ContextMenuPrimitive.Item>
	);
});

export const ContextMenuCheckboxItem = forwardRef<
	HTMLDivElement,
	ContextMenuPrimitive.MenuCheckboxItemProps
>((props, ref) => (
	<ContextMenuPrimitive.Item
		{...props}
		className={cn(itemMenuStyles(), props.className)}
		ref={ref}
	/>
));

const contentStyles = cva({
	base: [
		'w-48 rounded-lg px-1.5 py-1 shadow-popover md:w-56',
		'bg-white',
		'motion-safe:rdx-state-open:animate-scale-in-content',
		'motion-safe:rdx-state-closed:animate-scale-out-content origin-rdx-context-menu'
	]
});

export const ContextMenuContent = forwardRef<
	HTMLDivElement,
	ContextMenuPrimitive.ContextMenuContentProps
>((props, ref) => {
	return (
		<ContextMenuPrimitive.Portal>
			<ContextMenuPrimitive.Content
				{...props}
				className={cn(contentStyles(), props.className)}
				ref={ref}
			>
				{props.children}
			</ContextMenuPrimitive.Content>
		</ContextMenuPrimitive.Portal>
	);
});

export const ContextMenuSeparator = forwardRef<
	HTMLDivElement,
	ContextMenuPrimitive.MenuSeparatorProps
>((props, ref) => (
	<ContextMenuPrimitive.Separator
		{...props}
		className="h-px my-1 bg-border-primary"
		ref={ref}
	/>
));

export const ContextMenuLabel = forwardRef<
	HTMLDivElement,
	ContextMenuPrimitive.MenuLabelProps & { label: string }
>((props, ref) => {
	return (
		<ContextMenuPrimitive.Label
			className="px-2 py-2 text-xs text-gray-700 select-none"
			ref={ref}
		>
			{props.label}
		</ContextMenuPrimitive.Label>
	);
});

export const ContextMenuItemIndicator = ContextMenuPrimitive.ItemIndicator;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenu = ContextMenuPrimitive.Root;
