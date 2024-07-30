/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef } from 'react';

import { cn } from '../utils';

export type InputLabelProps = ComponentPropsWithRef<'label'>;

export const InputLabel = forwardRef<HTMLLabelElement, InputLabelProps>(
	({ children, className, ...props }, ref) => {
		return (
			<label
				className={cn(
					'font-normal text-text-secondary text-[0.875rem]',
					className
				)}
				{...props}
				ref={ref}
				data-testid="input-label"
			>
				{children}
			</label>
		);
	}
);
