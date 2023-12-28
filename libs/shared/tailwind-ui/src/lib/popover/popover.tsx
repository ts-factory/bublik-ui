/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { forwardRef } from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cva, cn } from '../utils';

const popoverContentStyles = cva({
	base: [
		'z-50',
		'will-change-[transform,opacity]',
		'rdx-state-open:rdx-side-top:animate-slide-down-fade',
		'rdx-state-open:rdx-side-right:animate-slide-left-fade',
		'rdx-state-open:rdx-side-bottom:animate-slide-up-fade',
		'rdx-state-open:rdx-side-left:animate-slide-right-fade',
		'rdx-state-closed:rdx-side-top:animate-fade-out',
		'rdx-state-closed:rdx-side-right:animate-fade-out',
		'rdx-state-closed:rdx-side-bottom:animate-fade-out',
		'rdx-state-closed:rdx-side-left:animate-fade-out'
	]
})();

export const StyledContent = forwardRef<
	HTMLDivElement,
	PopoverPrimitive.PopoverContentProps
>(({ children, ...props }, ref) => {
	return (
		<PopoverPrimitive.Content
			{...props}
			className={cn(popoverContentStyles, props.className)}
			collisionPadding={8}
			ref={ref}
		>
			{children}
		</PopoverPrimitive.Content>
	);
});

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverContent = StyledContent;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverArrow = PopoverPrimitive.Arrow;
