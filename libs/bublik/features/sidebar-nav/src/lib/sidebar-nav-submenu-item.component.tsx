/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type {
	ComponentType,
	MouseEvent,
	MouseEventHandler,
	PointerEvent,
	ReactNode
} from 'react';
import { createContext, useContext, useState } from 'react';
import { useLocation, type To } from 'react-router-dom';

import {
	cn,
	Dialog,
	DialogPortal,
	DialogContent,
	DialogOverlay,
	Icon,
	useSidebar,
	dialogContentStyles,
	dialogOverlayStyles,
	type IconProps
} from '@/shared/tailwind-ui';

import {
	SidebarAccordionLink,
	SidebarAccordionLabel
} from './sidebar-nav-accordion.component';
import {
	submenuGuideBranchStyles,
	submenuGuideItemStyles,
	submenuGuideStemStyles
} from './sidebar-nav.styles';
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
	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;
	const guideTone = disabled ? 'disabled' : isActive ? 'active' : 'inactive';

	const linkProps =
		'href' in props
			? { href: props.href }
			: { to: props.to, linkComponent: props.linkComponent };

	return (
		<li
			className={submenuGuideItemStyles({
				tone: guideTone,
				isSidebarOpen
			})}
			data-sidebar-nav-submenu-guide
			data-sidebar-nav-submenu-guide-active={isActive ? 'true' : undefined}
		>
			<span
				aria-hidden="true"
				data-sidebar-nav-guide-part
				data-sidebar-nav-guide-stem
				data-sidebar-nav-guide-stem-top
				className={submenuGuideStemStyles({ segment: 'top' })}
			/>
			<span
				aria-hidden="true"
				data-sidebar-nav-guide-part
				data-sidebar-nav-guide-stem
				data-sidebar-nav-guide-stem-bottom
				className={submenuGuideStemStyles({ segment: 'bottom' })}
			/>
			<span
				aria-hidden="true"
				data-sidebar-nav-guide-part
				data-sidebar-nav-guide-branch
				className={submenuGuideBranchStyles({ tone: guideTone })}
			/>
			<SidebarNavSubmenuItemContext.Provider value={{ disabled: !!disabled }}>
				<SidebarAccordionLink
					isActive={isActive}
					disabled={disabled}
					{...linkProps}
				>
					{children}
				</SidebarAccordionLink>
			</SidebarNavSubmenuItemContext.Provider>
		</li>
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
		<SidebarNavSubmenuItemComponent
			to={to}
			isActive={isActive}
			disabled={disabled}
			linkComponent={linkComponent}
		>
			{children}
		</SidebarNavSubmenuItemComponent>
	);
}

function SidebarNavSubmenuInfoButton({ children }: { children: ReactNode }) {
	const { disabled } = useSidebarNavSubmenuItem();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const { isSidebarOpen } = useSidebar();

	if (!children || !isSidebarOpen) return null;

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDialogOpen(true);
	};

	const stopDialogEventPropagation = (
		event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>
	) => {
		event.stopPropagation();
	};

	return (
		<>
			<button
				type="button"
				onClick={handleClick}
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
					<DialogOverlay
						className={dialogOverlayStyles()}
						onClick={stopDialogEventPropagation}
					>
						<DialogContent
							className={dialogContentStyles()}
							onClick={stopDialogEventPropagation}
							onPointerDown={stopDialogEventPropagation}
						>
							{children || (
								<div className="bg-white p-6 rounded-lg">
									<h2 className="text-lg font-semibold mb-4">Not Available</h2>
									<p>This section is not available yet.</p>
								</div>
							)}
						</DialogContent>
					</DialogOverlay>
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
