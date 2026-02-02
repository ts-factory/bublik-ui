/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import {
	createContext,
	useContext,
	ReactNode,
	useState,
	useEffect
} from 'react';

import { cn, useSidebar } from '@/shared/tailwind-ui';
import { wrapperStyles } from './sidebar-nav.styles';

interface SidebarCollapsibleContextValue {
	isSubmenuOpen: boolean;
	onToggle: () => void;
}

const SidebarCollapsibleContext = createContext<
	SidebarCollapsibleContextValue | undefined
>(undefined);

export const useSidebarCollapsible = () => {
	const context = useContext(SidebarCollapsibleContext);
	return context;
};

export interface SidebarNavCollapsibleContainerProps {
	isActive: boolean;
	children: ReactNode;
}

export const SidebarNavCollapsibleContainer = ({
	isActive,
	children
}: SidebarNavCollapsibleContainerProps) => {
	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;

	const [isSubmenuOpen, setIsSubmenuOpen] = useState(isActive);

	const onToggle = () => setIsSubmenuOpen(!isSubmenuOpen);

	// Auto-expand when on active routes
	useEffect(() => {
		if (isActive) setIsSubmenuOpen(true);
	}, [isActive]);

	// Close submenu when sidebar collapses (if not active)
	useEffect(() => {
		if (!isSidebarOpen && !isActive) setIsSubmenuOpen(false);
	}, [isSidebarOpen, isActive]);

	return (
		<SidebarCollapsibleContext.Provider value={{ isSubmenuOpen, onToggle }}>
			<div className="relative">{children}</div>
		</SidebarCollapsibleContext.Provider>
	);
};

// Compound component for submenu
SidebarNavCollapsibleContainer.Submenu = function SidebarNavCollapsibleSubmenu({
	children
}: {
	children: ReactNode;
}) {
	const context = useSidebarCollapsible();
	const isSubmenuOpen = context?.isSubmenuOpen ?? false;

	return (
		<div
			className={`
				[&>ul]:overflow-hidden grid transition-all transform-gpu ease-in-out motion-reduce:transition-none
				${
					isSubmenuOpen
						? 'grid-rows-[1fr] duration-300'
						: 'grid-rows-[0fr] duration-500'
				}
			`}
		>
			<ul className="flex flex-col gap-3">{children}</ul>
		</div>
	);
};

// Compound component for the main item wrapper (includes list wrapper styles)
SidebarNavCollapsibleContainer.Item = function SidebarNavCollapsibleItem({
	isActive,
	children
}: {
	isActive: boolean;
	children: ReactNode;
}) {
	const context = useSidebarCollapsible();
	const isSubmenuOpen = context?.isSubmenuOpen ?? false;

	return (
		<div
			className={cn(
				'relative transition-all rounded-lg delay-500 duration-500',
				isActive ? 'z-10' : '',
				isSubmenuOpen ? 'bg-primary-wash' : ''
			)}
		>
			<div
				className={cn(
					wrapperStyles({ isActive, isSubmenuOpen }),
					'transition-[margin-bottom] group relative',
					isSubmenuOpen ? 'mb-3.5' : 'delay-200 mb-0'
				)}
			>
				{children}
			</div>
		</div>
	);
};
