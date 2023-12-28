/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { CSSProperties } from 'react';

import { cn, useSidebar } from '@/shared/tailwind-ui';
import { useIsScrollbarVisible } from '@/shared/hooks';

import { SidebarLogoButton } from './logo-button';
import { MainNavigation } from './main-nav';
import { BottomNavigation } from './bottom-nav';

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

export const Sidebar = () => {
	const { isSidebarOpen } = useSidebar();
	const [ref, isVisible] = useIsScrollbarVisible<HTMLDivElement>();

	return (
		<nav
			className="flex flex-col h-full overflow-hidden bg-white no-bg-scrollbar"
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
			<div
				className="h-full pt-12 pb-[7px] overflow-y-auto px-[7px] styled-scrollbar"
				ref={ref}
			>
				<MainNavigation />
			</div>
			<div
				className={cn(
					'mt-auto px-[7px] pt-[7px] border-t pb-6',
					isVisible ? 'border-t-border-primary' : 'border-t-transparent'
				)}
			>
				<BottomNavigation />
			</div>
		</nav>
	);
};
