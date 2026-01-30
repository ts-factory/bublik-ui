/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef } from 'react';

import * as RadixToolbar from '@radix-ui/react-toolbar';

import { VariantProps, cn, cva } from '../utils';

export const toolbarToggleItemStyles = cva({
	base: ['grid place-items-center'],
	variants: {
		variant: {
			primary:
				'rdx-state-on:bg-primary rdx-state-on:text-white rdx-state-off:text-primary'
		},
		size: {
			default: 'rounded-md w-[22px] h-[22px]'
		}
	},
	defaultVariants: {
		variant: 'primary',
		size: 'default'
	}
});

export const toolbarToggleButtonStyles = cva({
	base: ['grid place-items-center'],
	variants: {
		variant: {
			primary: 'text-primary'
		},
		size: {
			default: 'rounded-md w-[22px] h-[22px]'
		},
		state: {
			default: '',
			active: 'text-white bg-primary',
			disabled: 'text-text-menu cursor-not-allowed'
		}
	},
	defaultVariants: {
		variant: 'primary',
		size: 'default'
	}
});

export const toolbarToggleGroupStyles = cva({
	base: ['flex items-center'],
	variants: {
		variant: {
			primary: 'bg-primary-wash'
		},
		size: {
			default: 'rounded-md gap-1 py-0.5 px-1'
		}
	},
	defaultVariants: {}
});

export const ToolbarButton = forwardRef<
	HTMLButtonElement,
	RadixToolbar.ToolbarButtonProps &
		VariantProps<typeof toolbarToggleButtonStyles>
>(({ className, variant, size, state, ...props }, ref) => (
	<RadixToolbar.Button
		{...props}
		className={cn(
			toolbarToggleButtonStyles({ variant, size, state }),
			className
		)}
		ref={ref}
	/>
));

export const ToolbarToggleItem = forwardRef<
	HTMLButtonElement,
	RadixToolbar.ToolbarToggleItemProps &
		VariantProps<typeof toolbarToggleItemStyles>
>(({ className, variant, size, ...props }, ref) => (
	<RadixToolbar.ToggleItem
		{...props}
		className={cn(toolbarToggleItemStyles({ variant, size }), className)}
		ref={ref}
	/>
));

export const ToolbarToggleGroup = forwardRef<
	HTMLDivElement,
	(
		| RadixToolbar.ToolbarToggleGroupSingleProps
		| RadixToolbar.ToolbarToggleGroupMultipleProps
	) &
		VariantProps<typeof toolbarToggleGroupStyles>
>(({ className, variant, size, ...props }, ref) => (
	<RadixToolbar.ToggleGroup
		{...props}
		className={cn(toolbarToggleGroupStyles({ variant, size }), className)}
		ref={ref}
	/>
));

export const Toolbar = RadixToolbar.Root;
export const ToolbarSeparator = RadixToolbar.Separator;
