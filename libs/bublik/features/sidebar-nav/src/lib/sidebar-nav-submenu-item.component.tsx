/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { ComponentType, MouseEventHandler, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { useLocation, type To } from 'react-router-dom';

import {
	cn,
	Dialog,
	DialogPortal,
	ModalContent,
	Icon,
	useSidebar,
	type IconProps
} from '@/shared/tailwind-ui';

import {
	SidebarAccordionLink,
	SidebarAccordionLabel
} from './sidebar-nav-accordion.component';
import {
	getSubmenuIsActive,
	type SubmenuMatchPattern
} from './sidebar-nav.matchers';

interface SidebarNavSubmenuItemContextValue {
	disabled: boolean;
}

const SidebarNavSubmenuItemContext = createContext<
	SidebarNavSubmenuItemContextValue | undefined
>(undefined);

export function useSidebarNavSubmenuItem(): SidebarNavSubmenuItemContextValue {
	const context = useContext(SidebarNavSubmenuItemContext);
	if (context === undefined) {
		throw new Error(
			'useSidebarNavSubmenuItem must be used within SidebarNavSubmenuItemContainer'
		);
	}
	return context;
}

function SidebarNavSubmenuIcon(props: Omit<IconProps, 'ref'>) {
	const { disabled } = useSidebarNavSubmenuItem();
	return (
		<div
			className={cn(
				'grid flex-shrink-0 place-items-center',
				disabled && 'opacity-60'
			)}
		>
			<Icon {...props} />
		</div>
	);
}

function SidebarNavSubmenuLabel({ children }: { children: ReactNode }) {
	const { disabled } = useSidebarNavSubmenuItem();
	return (
		<span
			className={cn(
				'truncate text-[0.875rem] leading-[1.5rem]',
				disabled && 'opacity-60'
			)}
		>
			{children}
		</span>
	);
}

type SidebarNavSubmenuItemProps = {
	children: ReactNode;
	isActive: boolean;
	disabled?: boolean;
} & (
	| {
			to: To;
			linkComponent?: ComponentType<{
				to: To;
				className?: string;
				style?: React.CSSProperties;
				children: ReactNode;
				onClick?: MouseEventHandler<HTMLAnchorElement>;
			}>;
	  }
	| { href: string }
);

function SidebarNavSubmenuItemComponent(props: SidebarNavSubmenuItemProps) {
	const { children, isActive, disabled } = props;

	const linkProps =
		'href' in props
			? { href: props.href }
			: { to: props.to, linkComponent: props.linkComponent };

	return (
		<SidebarAccordionLink
			isActive={isActive}
			disabled={disabled}
			{...linkProps}
		>
			{children}
		</SidebarAccordionLink>
	);
}

interface SidebarNavSubmenuItemContainerProps {
	children: ReactNode;
	to: string;
	disabled?: boolean;
	pattern?: SubmenuMatchPattern;
	linkComponent?: ComponentType<{
		to: To;
		className?: string;
		style?: React.CSSProperties;
		children: ReactNode;
		onClick?: MouseEventHandler<HTMLAnchorElement>;
	}>;
}

export function SidebarNavSubmenuItemContainer({
	children,
	to,
	disabled = false,
	pattern,
	linkComponent
}: SidebarNavSubmenuItemContainerProps) {
	const location = useLocation();
	const isActive = pattern ? getSubmenuIsActive(location, pattern) : true;

	return (
		<SidebarNavSubmenuItemContext.Provider value={{ disabled }}>
			<SidebarNavSubmenuItemComponent
				to={to}
				isActive={isActive}
				disabled={disabled}
				linkComponent={linkComponent}
			>
				{children}
			</SidebarNavSubmenuItemComponent>
		</SidebarNavSubmenuItemContext.Provider>
	);
}

function SidebarNavSubmenuInfoButton({ children }: { children: ReactNode }) {
	const { disabled } = useSidebarNavSubmenuItem();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const { isSidebarOpen } = useSidebar();

	if (!children || !isSidebarOpen) return null;

	return (
		<>
			<button
				onClick={() => setIsDialogOpen(true)}
				data-info-button
				className={cn(
					'rounded ml-auto p-0.5 hover:bg-primary-wash hover:text-primary',
					disabled
						? 'text-primary pointer-events-auto visible opacity-100'
						: 'opacity-0 invisible group-hover:visible group-hover:opacity-100',
					'transition-opacity duration-300 delay-0',
					'group-hover:pointer-events-auto'
				)}
			>
				<Icon name="InformationCircleQuestionMark" size={20} />
			</button>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogPortal>
					<ModalContent>
						{children || (
							<div className="bg-white p-6 rounded-lg">
								<h2 className="text-lg font-semibold mb-4">Not Available</h2>
								<p>This section is not available yet.</p>
							</div>
						)}
					</ModalContent>
				</DialogPortal>
			</Dialog>
		</>
	);
}

SidebarNavSubmenuItemContainer.Icon = SidebarNavSubmenuIcon;
SidebarNavSubmenuItemContainer.Label = SidebarNavSubmenuLabel;
SidebarNavSubmenuItemContainer.InfoButton = SidebarNavSubmenuInfoButton;
SidebarNavSubmenuItemContainer.SidebarAccordionLabel = SidebarAccordionLabel;

export const SidebarNavSubmenuItem = Object.assign(
	SidebarNavSubmenuItemComponent,
	{
		Icon: SidebarNavSubmenuIcon,
		Label: SidebarNavSubmenuLabel,
		InfoButton: SidebarNavSubmenuInfoButton,
		SidebarAccordionLabel: SidebarAccordionLabel
	}
);
