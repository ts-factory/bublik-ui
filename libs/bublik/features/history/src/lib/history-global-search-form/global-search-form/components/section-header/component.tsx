/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { ComponentPropsWithRef, forwardRef } from 'react';

export interface FormSectionHeaderProps extends ComponentPropsWithRef<'div'> {
	name: string;
}

export const FormSectionHeader = forwardRef<
	HTMLDivElement,
	FormSectionHeaderProps
>(({ name, children, ...props }, ref) => {
	return (
		<div className="mb-4" {...props}>
			<div className="flex items-center justify-between gap-2 pl-2" ref={ref}>
				<span className="truncate text-[0.8125rem] font-semibold uppercase leading-5 tracking-[0.06em] text-text-secondary">
					{name}
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
