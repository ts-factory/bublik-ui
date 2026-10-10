/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef } from 'react';

import { cn } from '../utils';

export type InputLabelProps = ComponentPropsWithRef<'label'>;

/**
 * The backdrop of a label floated over a field's top border: white down to
 * the border line, which it hides, and clear below it, so the field shows
 * through — a disabled field's grey, or the badge a select shows as its value,
 * neither covered by a white box.
 */
export const FLOATING_LABEL_BACKDROP_CLASS =
	'bg-[linear-gradient(to_bottom,white_12px,transparent_12px)]';

export const InputLabel = forwardRef<HTMLLabelElement, InputLabelProps>(
	({ children, className, ...props }, ref) => {
		return (
			<label
				className={cn(
					'font-medium text-text-secondary text-[0.875rem]',
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
