/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import * as React from 'react';
import { DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';

import { cn } from '../utils';
import { Dialog, DialogContent } from '../dialog';

export const Command = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
	<CommandPrimitive
		ref={ref}
		className={cn(
			'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
			className
		)}
		{...props}
	/>
));
Command.displayName = CommandPrimitive.displayName;

type CommandDialogProps = DialogProps;

export const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
	return (
		<Dialog {...props}>
			<DialogContent className="p-0 overflow-hidden shadow-2xl">
				<Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	);
};

export type CommandInputProps = React.ComponentPropsWithoutRef<
	typeof CommandPrimitive.Input
> & {
	startIcon?: React.ReactNode;
	endIcon?: React.ReactNode;
};

export const CommandInput = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Input>,
	CommandInputProps
>(({ className, startIcon, endIcon, ...props }, ref) => {
	return (
		<div
			className="flex items-center px-3 border-b border-border-primary"
			cmdk-input-wrapper=""
		>
			{startIcon}
			<CommandPrimitive.Input
				ref={ref}
				className={cn(
					'flex h-11 w-full rounded-md bg-transparent py-3 text-sm border-none outline:none focus:ring-0 placeholder:text-text-menu disabled:cursor-not-allowed disabled:opacity-50',
					className
				)}
				{...props}
			/>
			{endIcon}
		</div>
	);
});

CommandInput.displayName = CommandPrimitive.Input.displayName;

export const CommandList = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.List
		ref={ref}
		className={cn('max-h-[300px] overflow-y-auto overflow-x-hidden', className)}
		{...props}
	/>
));

CommandList.displayName = CommandPrimitive.List.displayName;

export const CommandEmpty = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Empty>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
	<CommandPrimitive.Empty
		ref={ref}
		className="py-6 text-sm text-center"
		{...props}
	/>
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

export const CommandGroup = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Group>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Group
		ref={ref}
		className={cn(
			'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
			className
		)}
		{...props}
	/>
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

export const CommandSeparator = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Separator>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Separator
		ref={ref}
		className={cn('-mx-1 h-px bg-border-primary', className)}
		{...props}
	/>
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

export const CommandItem = React.forwardRef<
	React.ElementRef<typeof CommandPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
	<CommandPrimitive.Item
		ref={ref}
		className={cn(
			'relative flex cursor-default select-none items-center rounded px-2 py-1.5 text-sm outline-none aria-selected:bg-primary-wash aria-selected:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
			className
		)}
		{...props}
	/>
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

export const CommandShortcut = ({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn(
				'ml-auto text-xs tracking-widest text-muted-foreground',
				className
			)}
			{...props}
		/>
	);
};
CommandShortcut.displayName = 'CommandShortcut';
