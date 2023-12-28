/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';

import { VariantProps, cn, cva } from '../utils';

export const twButtonStyles = cva({
	base: [
		'inline-flex items-center justify-center',
		'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
		'transition-all appearance-none select-none'
	],
	variants: {
		variant: {
			primary: [
				'bg-primary text-white',
				'disabled:shadow-[inset_0_0_0_1px_hsl(var(--colors-border-primary))] disabled:bg-white disabled:hover:bg-white disabled:text-text-menu'
			],
			destruction: [
				'bg-bg-error text-white',
				'disabled:shadow-[inset_0_0_0_1px_hsl(var(--colors-border-primary))] disabled:bg-white disabled:hover:bg-white disabled:text-text-menu'
			],
			secondary: [
				'text-primary bg-primary-wash',
				'disabled:shadow-[inset_0_0_0_1px_hsl(var(--colors-border-primary))] disabled:bg-white disabled:hover:bg-white disabled:text-border-primary'
			],
			outline: [
				'border border-border-primary text-text-primary hover:bg-gray-50',
				'disabled:bg-white disabled:hover:bg-white disabled:text-text-menu'
			],
			'outline-secondary': [
				'border border-border-primary text-text-primary hover:bg-gray-50',
				'disabled:bg-white disabled:hover:bg-white disabled:text-text-menu'
			],
			ghost: [
				'border border-transparent text-text-primary hover:bg-gray-50',
				'disabled:bg-white disabled:hover:bg-white disabled:text-text-menu'
			],
			link: [
				'border border-transparent text-text-primary',
				'hover:underline',
				'disabled:bg-white disabled:hover:bg-white disabled:text-text-menu'
			]
		},
		size: {
			xss: 'py-[5px] px-1.5 text-[0.6875rem] font-semibold leading-[0.875rem] max-h-[26px]',
			xs: 'px-2.5 py-1.5 text-xs font-medium',
			'xs/2': 'px-2.5 py-[7px] text-xs font-medium',
			sm: 'px-3 py-1.5 text-sm',
			'sm/2': 'px-3 py-[8px] text-sm',
			md: 'px-3 py-[7px] text-[0.875rem] leading-[1.5rem]',
			lg: 'px-3 py-2.5 text-base'
		},
		state: {
			default: '',
			active: '',
			loading: 'cursor-now-allowed pointer-events-none',
			disabled: 'cursor-not-allowed pointer-events-none',
			true: ''
		},
		rounded: {
			none: 'rounded-none',
			sm: 'rounded-sm',
			true: 'rounded',
			md: 'rounded-md',
			lg: 'rounded-lg',
			xl: 'rounded-xl',
			'2xl': 'rounded-2xl',
			'3xl': 'rounded-3xl',
			full: 'rounded-full'
		}
	},
	compoundVariants: [
		{
			variant: ['destruction'],
			size: 'xss',
			className: 'hover:shadow-[inset_0_0_0_2px_#fca5b3] py-1.5'
		},
		{
			variant: ['destruction'],
			size: 'xs',
			className: 'hover:shadow-[inset_0_0_0_3px_#fca5b3] py-[7px]'
		},
		{
			variant: ['destruction'],
			size: 'xs/2',
			className: 'hover:shadow-[inset_0_0_0_3px_#fca5b3] py-[8px]'
		},
		{
			variant: ['destruction'],
			size: 'sm',
			className: 'hover:shadow-[inset_0_0_0_3px_#fca5b3] py-[7px]'
		},
		{
			variant: ['destruction'],
			size: 'sm/2',
			className: 'hover:shadow-[inset_0_0_0_3px_#fca5b3] py-[9px]'
		},
		{
			variant: ['destruction'],
			size: 'md',
			className: 'hover:shadow-[inset_0_0_0_3px_#fca5b3] py-2'
		},
		{
			variant: ['destruction'],
			size: 'lg',
			className: 'hover:shadow-[inset_0_0_0_4px_#fca5b3] py-[11px]'
		},
		{
			variant: ['primary', 'secondary'],
			size: 'xss',
			className: 'hover:shadow-[inset_0_0_0_2px_#94b0ff] py-1.5'
		},
		{
			variant: ['primary', 'secondary'],
			size: 'xs',
			className: 'hover:shadow-[inset_0_0_0_3px_#94b0ff] py-[7px]'
		},
		{
			variant: ['primary', 'secondary'],
			size: 'xs/2',
			className: 'hover:shadow-[inset_0_0_0_3px_#94b0ff] py-2'
		},
		{
			variant: ['primary', 'secondary'],
			size: 'sm',
			className: 'hover:shadow-[inset_0_0_0_3px_#94b0ff] py-[7px]'
		},
		{
			variant: ['primary', 'secondary'],
			size: 'sm/2',
			className: 'hover:shadow-[inset_0_0_0_3px_#94b0ff] py-[9px]'
		},
		{
			variant: ['primary', 'secondary'],
			size: 'md',
			className: 'hover:shadow-[inset_0_0_0_3px_#94b0ff] py-2'
		},
		{
			variant: ['primary', 'secondary'],
			size: 'lg',
			className: 'hover:shadow-[inset_0_0_0_4px_#94b0ff] py-[11px]'
		},
		{
			variant: ['primary', 'secondary'],
			state: 'disabled',
			className:
				'shadow-[inset_0_0_0_1px_hsl(var(--colors-border-primary))] bg-white hover:bg-white text-border-primary'
		},
		// Active
		{
			variant: ['secondary', 'outline'],
			state: ['active', 'loading'],
			className:
				'bg-primary text-white hover:bg-primary hover:text-white border-transparent'
		},
		{
			variant: 'outline-secondary',
			state: 'active',
			className: 'shadow-text-field border-primary'
		}
	],
	defaultVariants: {
		variant: 'primary',
		size: 'md',
		rounded: 'md',
		state: 'default'
	}
});

export type ButtonStylesProps = VariantProps<typeof twButtonStyles>;

export type ButtonTwProps = ComponentPropsWithRef<'button'> &
	ButtonStylesProps & {
		asChild?: boolean;
	};

export const ButtonTw = forwardRef<HTMLButtonElement, ButtonTwProps>(
	(
		{
			asChild,
			variant,
			size,
			state,
			rounded,
			className,
			disabled,
			children,
			tabIndex,
			...props
		},
		ref
	) => {
		const Comp = asChild ? Slot : 'button';

		return (
			<Comp
				className={cn(
					twButtonStyles({
						variant,
						size,
						state: disabled ? 'disabled' : state,
						rounded
					}),
					className
				)}
				disabled={disabled}
				tabIndex={state === 'disabled' ? -1 : tabIndex}
				{...props}
				ref={ref}
			>
				{children}
			</Comp>
		);
	}
);

ButtonTw.displayName = 'Button';
