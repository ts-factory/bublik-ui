/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React, { ComponentPropsWithRef, forwardRef } from 'react';

import { cn, cva, VariantProps } from '../utils';
import { ErrorMessage } from '../error-message';
import { InputLabel } from '../input-label';

/**
 * Matched to `Input`'s box, down to the padding and the type scale, because the
 * two sit in the same forms one under the other and any difference between them
 * reads as a mistake rather than as a distinction.
 */
export const textAreaStyles = cva({
	base: [
		'block w-full px-3.5 py-[7px] rounded border outline-none transition-all',
		'text-text-secondary leading-[1.5rem] font-medium text-[0.875rem]',
		'placeholder:text-text-menu placeholder:font-normal',
		'resize-none focus:ring-transparent active:shadow-none',
		'disabled:text-text-menu disabled:cursor-not-allowed'
	],
	variants: {
		variant: {
			primary:
				'border-border-primary focus:shadow-text-field focus:border-primary hover:border-primary',
			error:
				'border-bg-error focus:shadow-text-field-error focus:border-bg-error hover:border-bg-error caret-bg-error shadow-text-field-error'
		}
	}
});

export type TextAreaProps = ComponentPropsWithRef<'textarea'> &
	VariantProps<typeof textAreaStyles> & {
		label: string;
		error?: string;
	};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	(
		{ error, name, label, variant = 'primary', className, disabled, ...props },
		ref
	) => {
		return (
			<div className="relative">
				{/* Notched into the top border, exactly as `Input` does it, rather
				    than stacked above the box. Stacked, a description field in a
				    form of `Input`s was the one field whose label sat somewhere
				    different — and it pushed everything below it out of rhythm. */}
				{label && (
					<InputLabel
						className={cn(
							'absolute top-[-11px] left-2 z-10',
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
				/>
				{error && <ErrorMessage>{error}</ErrorMessage>}
			</div>
		);
	}
);
