/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import React, { ComponentPropsWithRef, forwardRef } from 'react';

import { cn, cva, VariantProps } from '../utils';

export const textAreaStyles = cva({
	base: 'block w-full rounded-md sm:text-sm focus:ring-transparent transition-all resize-none active:shadow-none',
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
		label: string;
		error?: string;
	};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
	({ error, name, label, variant = 'primary', className, ...props }, ref) => {
		return (
			<div className="flex flex-col gap-2">
				<label
					htmlFor={name}
					className="block mb-1 text-sm font-medium text-text-primary"
				>
					{label}
				</label>
				<textarea
					{...props}
					name={name}
					id={name}
					className={cn(
						textAreaStyles({ variant: error ? 'error' : variant }),
						className
					)}
					ref={ref}
				/>
				{error && (
					<p className="text-[0.75rem] font-normal text-bg-error">{error}</p>
				)}
			</div>
		);
	}
);
