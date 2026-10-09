/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ComponentPropsWithRef, ReactNode, forwardRef } from 'react';

import { cn } from '../utils';

export interface FormSectionHeaderProps extends ComponentPropsWithRef<'div'> {
	name: string;
	/** Beside the name, where a reader asking what the section is looks. */
	beside?: ReactNode;
}

export const FormSectionHeader = forwardRef<
	HTMLDivElement,
	FormSectionHeaderProps
>(({ name, beside, children, className, ...props }, ref) => {
	return (
		<div className={cn('mb-4', className)} {...props}>
			<div className="flex items-center justify-between gap-2 pl-2" ref={ref}>
				<span className="flex min-w-0 items-center gap-1">
					<span className="truncate text-[0.8125rem] font-semibold uppercase leading-5 tracking-[0.06em] text-text-secondary">
						{name}
					</span>
					{beside}
				</span>
				{children ? (
					<div className="flex shrink-0 items-center gap-1 pr-[5px]">
						{children}
					</div>
				) : null}
			</div>
		</div>
	);
});

FormSectionHeader.displayName = 'FormSectionHeader';
