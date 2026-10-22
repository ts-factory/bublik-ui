/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { CSSProperties, ReactNode } from 'react';

import {
	ScrollArea,
	ScrollAreaScrollbar,
	ScrollAreaThumb,
	ScrollAreaViewport,
	cn,
	useSidebar
} from '@/shared/tailwind-ui';
import { useIsScrollbarVisible } from '@/shared/hooks';

import { SidebarLogoButton } from './logo-button';

const getSidebarStyles = (isOpen?: boolean) => {
	const base = {
		transition: 'all 0.5s ease',
		overflowX: 'hidden'
	} as CSSProperties;

	const closedStyles = {
		'--sidebar-width': '56px',
		width: 'var(--sidebar-width)'
	};

	const openStyles = {
		'--sidebar-width': '252px',
		width: 'var(--sidebar-width)'
	};

	return isOpen
		? Object.assign(base, openStyles)
		: Object.assign(base, closedStyles);
};

interface SidebarProps {
	headerSlot?: ReactNode;
	footerSlot?: ReactNode;
	children?: ReactNode;
}

export const Sidebar = ({ headerSlot, footerSlot, children }: SidebarProps) => {
	const { isSidebarOpen } = useSidebar();
	const [ref, isVisible] = useIsScrollbarVisible<HTMLDivElement>();

	return (
		<nav
			className="flex flex-col h-full overflow-hidden bg-bg-primary no-bg-scrollbar"
			style={getSidebarStyles(isSidebarOpen)}
		>
			<div
				className={cn(
					'px-[7px] border-b pt-6 pb-[7px]',
					isVisible ? 'border-b-border-primary' : 'border-b-transparent'
				)}
			>
				<SidebarLogoButton />
			</div>
			{/* A native scrollbar takes its width from the collapsed sidebar's
			    42px column and squeezes the icons. The thumb floats over the
			    right padding instead, and shows while hovering or scrolling. */}
			<ScrollArea
				type="hover"
				className="relative h-full min-h-0 overflow-hidden"
			>
				<ScrollAreaViewport
					ref={ref}
					// Radix wraps the children in a `display: table` div that grows
					// to the labels' max-content width; keep it to the column.
					className="h-full w-full pt-12 pb-[7px] px-[7px] [&>div]:!block"
				>
					<ul className="flex flex-col gap-3">
						{headerSlot}
						{children}
					</ul>
				</ScrollAreaViewport>
				<ScrollAreaScrollbar
					orientation="vertical"
					className="flex w-[5px] select-none touch-none py-1 pr-px bg-transparent"
				>
					<ScrollAreaThumb className="flex-1 rounded-full bg-text-menu/60 hover:bg-text-menu" />
				</ScrollAreaScrollbar>
			</ScrollArea>
			<div
				className={cn(
					'mt-auto px-[7px] pt-[7px] border-t pb-6',
					isVisible ? 'border-t-border-primary' : 'border-t-transparent'
				)}
			>
				<ul className="flex flex-col gap-3">{footerSlot}</ul>
			</div>
		</nav>
	);
};
