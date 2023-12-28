/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef } from 'react';

import { cn } from '../utils';

export type ErrorMessageProps = ComponentPropsWithRef<'span'>;

export const ErrorMessage = forwardRef<HTMLSpanElement, ErrorMessageProps>(
	({ children, className, ...props }, ref) => {
		return (
			<span
				className={cn('text-[0.75rem] font-normal text-bg-error', className)}
				{...props}
				ref={ref}
				data-testid="input-error-message"
			>
				{children}
			</span>
		);
	}
);
