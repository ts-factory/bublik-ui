/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, forwardRef } from 'react';

export interface FormSectionHeaderProps extends ComponentPropsWithRef<'div'> {
	name: string;
	error?: string;
}

export const FormSectionHeader = forwardRef<
	HTMLDivElement,
	FormSectionHeaderProps
>(({ name, error, children, ...props }, ref) => {
	return (
		<div className="mb-4" {...props}>
			<div className="flex items-center justify-between" ref={ref}>
				<legend className="text-[0.75rem] font-semibold leading-[0.875rem]">
					{name}
				</legend>
				<div className="flex items-center gap-2">{children}</div>
			</div>
			{error && (
				<span className="text-[0.75rem] leading-[0.875rem] text-text-unexpected">
					{error}
				</span>
			)}
		</div>
	);
});

FormSectionHeader.displayName = 'FormSectionHeader';
