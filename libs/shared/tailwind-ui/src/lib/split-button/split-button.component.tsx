/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2025 OKTET LTD */
import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { cn } from '../utils';
import { ButtonTw, ButtonStylesProps } from '../button';
import { Separator } from '../separator';

interface SplitButtonContextValue extends ButtonStylesProps {
	disabled?: boolean;
}

const SplitButtonContext = React.createContext<SplitButtonContextValue>({});

const SplitButtonRoot = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & SplitButtonContextValue
>(({ className, variant, size, state, rounded, disabled, ...props }, ref) => {
	const value = React.useMemo(
		() => ({ variant, size, state, rounded, disabled }),
		[disabled, rounded, size, state, variant]
	);

	return (
		<div
			ref={ref}
			className={cn('inline-flex group items-center', className)}
			{...props}
		>
			<SplitButtonContext.Provider value={value}>
				<DropdownMenu.Root>{props.children}</DropdownMenu.Root>
			</SplitButtonContext.Provider>
		</div>
	);
});

const SplitButtonButton = React.forwardRef<
	HTMLButtonElement,
	React.ComponentPropsWithoutRef<typeof ButtonTw>
>(({ className, children, ...props }, ref) => {
	const context = React.useContext(SplitButtonContext);
	const isOutline = context.variant?.includes('outline');

	return (
		<ButtonTw
			ref={ref}
			className={cn('rounded-r-none', isOutline && 'border-r-0', className)}
			{...context}
			{...props}
		>
			{children}
		</ButtonTw>
	);
});

const SplitButtonTrigger = React.forwardRef<
	HTMLButtonElement,
	React.ComponentPropsWithoutRef<typeof ButtonTw>
>(({ className, children, ...props }, ref) => {
	const context = React.useContext(SplitButtonContext);
	const isOutline = context.variant?.includes('outline');

	return (
		<DropdownMenu.Trigger asChild>
			<ButtonTw
				ref={ref}
				className={cn('rounded-l-none', isOutline && 'border-l-0', className)}
				{...context}
				{...props}
			>
				{children}
			</ButtonTw>
		</DropdownMenu.Trigger>
	);
});

const SplitButtonContent = React.forwardRef<
	React.ElementRef<typeof DropdownMenu.Content>,
	React.ComponentPropsWithoutRef<typeof DropdownMenu.Content>
>(({ className, align, sideOffset, ...props }, ref) => (
	<DropdownMenu.Portal>
		<DropdownMenu.Content
			ref={ref}
			className={cn(
				'min-w-[220px] bg-white rounded-lg p-1 shadow-popover',
				'rdx-state-open:rdx-side-top:animate-slide-down-fade',
				'rdx-state-open:rdx-side-right:animate-slide-left-fade',
				'rdx-state-open:rdx-side-bottom:animate-slide-up-fade',
				'rdx-state-open:rdx-side-left:animate-slide-right-fade',
				'rdx-state-closed:rdx-side-top:animate-fade-out',
				'rdx-state-closed:rdx-side-right:animate-fade-out',
				'rdx-state-closed:rdx-side-bottom:animate-fade-out',
				'rdx-state-closed:rdx-side-left:animate-fade-out',
				className
			)}
			align={align}
			sideOffset={8}
			{...props}
		/>
	</DropdownMenu.Portal>
));

const SplitButtonContentLabel = React.forwardRef<
	React.ElementRef<typeof DropdownMenu.Label>,
	React.ComponentPropsWithoutRef<typeof DropdownMenu.Label>
>(({ className, ...props }, ref) => (
	<DropdownMenu.Label
		ref={ref}
		{...props}
		className={cn('px-2 py-1.5 font-semibold text-xs', className)}
	/>
));

const SplitButtonContentItem = React.forwardRef<
	React.ElementRef<typeof DropdownMenu.Item>,
	React.ComponentPropsWithoutRef<typeof DropdownMenu.Item>
>(({ className, ...props }, ref) => (
	<DropdownMenu.Item
		ref={ref}
		{...props}
		className={cn(
			'relative flex gap-2 cursor-default select-none items-center rounded py-1.5 pl-2 pr-2 outline-none transition-colors focus:bg-primary-wash focus:text-primary rdx-disabled:pointer-events-none rdx-disabled:opacity-50 text-xs',
			className
		)}
	/>
));

const SplitButtonSeparator = React.forwardRef<
	React.ElementRef<typeof Separator>,
	React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
	<Separator ref={ref} {...props} className={className} />
));

const SplitButton = Object.assign(SplitButtonRoot, {
	Root: SplitButtonRoot,
	Button: SplitButtonButton,
	Trigger: SplitButtonTrigger,
	Content: SplitButtonContent,
	Label: SplitButtonContentLabel,
	Item: SplitButtonContentItem,
	Separator: SplitButtonSeparator
});

export { SplitButton };
