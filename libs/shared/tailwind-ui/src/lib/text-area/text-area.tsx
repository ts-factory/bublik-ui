/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef } from 'react';

import { cn, cva, VariantProps } from '../utils';
import { ErrorMessage } from '../error-message';
import { InputLabel } from '../input-label';

export const textAreaStyles = cva({
	base: [
		'block',
		'w-full',
		'px-3.5',
		'py-[7px]',
		'outline-none',
		'border',
		'rounded',
		'text-text-secondary',
		'transition-all',
		'resize-none',
		'disabled:text-text-menu',
		'disabled:cursor-not-allowed',
		'active:shadow-none',
		'focus:ring-transparent',
		'placeholder:text-text-menu placeholder:font-normal',
		'font-medium text-[0.875rem] leading-[1.5rem]'
	],
	variants: {
		variant: {
			primary:
				'border-border-primary focus:shadow-text-field focus:border-primary hover:border-primary',
			error:
				'border-bg-error focus:shadow-text-field-error focus:border-bg-error hover:border-bg-error'
		}
	}
});

export type TextAreaProps = ComponentPropsWithRef<'textarea'> &
	VariantProps<typeof textAreaStyles> & {
		label?: string;
		error?: string;
	};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	(
		{ error, name, label, variant = 'primary', className, disabled, ...props },
		ref
	) => {
		return (
			<div className="relative">
				{label && (
					<InputLabel
						className={cn(
							'absolute top-[-11px] left-2',
							disabled ? 'bg-bg-body text-border-primary' : 'bg-white'
						)}
						htmlFor={name}
					>
						{label}
					</InputLabel>
				)}
				<textarea
					{...props}
					name={name}
					id={name}
					disabled={disabled}
					className={cn(
						textAreaStyles({ variant: error ? 'error' : variant }),
						className
					)}
					ref={ref}
					data-testid="textarea"
				/>
				{error && <ErrorMessage>{error}</ErrorMessage>}
			</div>
		);
	}
);
