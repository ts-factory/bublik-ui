/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { ComponentPropsWithRef, ReactNode, forwardRef, useRef } from 'react';
import { mergeRefs } from '@react-aria/utils';

import { cn } from '../utils';
import { useIsSticky } from '@/shared/hooks';

export interface CardHeaderProps extends ComponentPropsWithRef<'div'> {
	label: string | ReactNode;
	enableStickyShadow?: boolean;
	children?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
	(props, ref) => {
		const { label, className, enableStickyShadow, children } = props;
		const headerRef = useRef<HTMLDivElement>(null);
		const { isSticky } = useIsSticky(headerRef);

		return (
			<div
				className={cn(
					'flex items-center justify-between py-1 px-4 border-b border-b-border-primary h-9 flex-shrink-0',
					isSticky && enableStickyShadow && 'shadow-sticky border-transparent',
					className
				)}
				ref={mergeRefs(ref, headerRef)}
				style={props.style}
			>
				{typeof label === 'string' ? (
					<span className="text-text-primary text-[0.75rem] font-semibold leading-[0.875rem]">
						{label}
					</span>
				) : (
					label
				)}
				{children}
			</div>
		);
	}
);

CardHeader.displayName = 'CardHeader';
