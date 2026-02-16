/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { forwardRef } from 'react';

import { cn, Icon, useSidebar } from '@/shared/tailwind-ui';

import {
	listWrapperStyles,
	toggleWrapperStyles,
	wrapperStyles
} from './sidebar-nav.styles';
import { useSidebarCollapsible } from './sidebar-nav-collapsible.component';

export interface SidebarNavToggleLocalProps {
	isSubmenuOpen?: boolean;
	isActive?: boolean;
	onToggle?: () => void;
}

export const SidebarNavToggle = ({
	isSubmenuOpen: isSubmenuOpenProp,
	isActive: isActiveProp,
	onToggle: onToggleProp
}: SidebarNavToggleLocalProps) => {
	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;

	const collapsibleContext = useSidebarCollapsible();

	const isSubmenuOpen =
		isSubmenuOpenProp ?? collapsibleContext?.isSubmenuOpen ?? false;
	const onToggle = onToggleProp ?? collapsibleContext?.onToggle;
	const isActive = isActiveProp ?? collapsibleContext?.isActive ?? false;

	return (
		<button
			aria-label="Toggle submenu"
			className={toggleWrapperStyles({
				isSubmenuOpen,
				isSidebarOpen,
				isActive
			})}
			onClick={onToggle}
		>
			<Icon name="ArrowShortTop" />
		</button>
	);
};

export interface SidebarNavSubmenuContainerProps {
	isSubmenuOpen: boolean;
	children: React.ReactNode;
}

export const SidebarNavSubmenuContainer = ({
	isSubmenuOpen,
	children
}: SidebarNavSubmenuContainerProps) => {
	return (
		<div
			className={cn(
				'[&>ul]:overflow-hidden grid transition-all transform-gpu ease-in-out motion-reduce:transition-none',
				isSubmenuOpen
					? 'grid-rows-[1fr] duration-300'
					: 'grid-rows-[0fr] duration-500'
			)}
		>
			<ul className="flex flex-col gap-3">{children}</ul>
		</div>
	);
};

export interface SidebarNavItemContainerProps {
	isActive: boolean;
	isSubmenuOpen: boolean;
	children: React.ReactNode;
	className?: string;
}

export const SidebarNavItemContainer = forwardRef<
	HTMLDivElement,
	SidebarNavItemContainerProps
>(function SidebarNavItemContainer(
	{ isActive, isSubmenuOpen, children, className, ...rest },
	ref
) {
	return (
		<div
			ref={ref}
			className={cn(
				wrapperStyles({
					isActive,
					isSubmenuOpen
				}),
				'transition-[margin-bottom] group relative',
				isSubmenuOpen ? 'mb-3.5' : 'delay-200 mb-0',
				className
			)}
			{...rest}
		>
			{children}
		</div>
	);
});

export const SidebarNavListWrapper = ({
	isSubmenuOpen,
	children
}: {
	isSubmenuOpen: boolean;
	children: React.ReactNode;
}) => {
	return <div className={listWrapperStyles({ isSubmenuOpen })}>{children}</div>;
};
