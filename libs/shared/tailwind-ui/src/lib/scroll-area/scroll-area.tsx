/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { PropsWithChildren, forwardRef } from 'react';

const StyledViewport = forwardRef<
	HTMLDivElement,
	ScrollAreaPrimitive.ScrollAreaViewportProps
>((props, ref) => (
	<ScrollAreaPrimitive.Viewport
		className="w-full h-full rounded-[inherit]"
		{...props}
		ref={ref}
	/>
));

const StyledScrollbar = forwardRef<
	HTMLDivElement,
	ScrollAreaPrimitive.ScrollAreaScrollbarProps
>((props, ref) => (
	<ScrollAreaPrimitive.Scrollbar
		className="flex select-none touch-none p-0.5 bg-bg-body transition-colors hover:bg-transparent rdx-orientation-vertical:w-[10px] rdx-orientation-horizontal:flex-col rdx-orientation-horizontal:h-2.5"
		{...props}
		ref={ref}
	/>
));

const StyledThumb = forwardRef<
	HTMLDivElement,
	ScrollAreaPrimitive.ScrollAreaThumbProps
>((props, ref) => (
	<ScrollAreaPrimitive.Thumb
		className="flex-1 bg-text-menu rounded-[10px] relative before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:transform before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]"
		{...props}
		ref={ref}
	/>
));

export const ScrollArea = ScrollAreaPrimitive.Root;
export const ScrollAreaViewport = StyledViewport;
export const ScrollAreaScrollbar = StyledScrollbar;
export const ScrollAreaThumb = StyledThumb;
export const ScrollAreaCorner = ScrollAreaPrimitive.Corner;

export const TwScrollArea = (
	props: PropsWithChildren<{ className?: string }>
) => {
	return (
		<ScrollArea>
			<ScrollAreaViewport className={props.className}>
				{props.children}
			</ScrollAreaViewport>
			<ScrollAreaScrollbar orientation="vertical">
				<ScrollAreaThumb />
			</ScrollAreaScrollbar>
			<ScrollAreaScrollbar orientation="horizontal">
				<ScrollAreaThumb />
			</ScrollAreaScrollbar>
			<ScrollAreaCorner />
		</ScrollArea>
	);
};
