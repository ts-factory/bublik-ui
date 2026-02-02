/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useRef, useState } from 'react';

import {
	Dialog,
	ModalContent,
	DialogPortal,
	useSidebar
} from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

import {
	SidebarNavInternalLink,
	SidebarNavExternalLink,
	SidebarNavInfoButton,
	SidebarNavLinkWrapper
} from './sidebar-nav-link.component';
import {
	SidebarNavToggle,
	SidebarNavSubmenuContainer,
	SidebarNavItemContainer,
	SidebarNavListWrapper
} from './sidebar-nav-submenu.component';
import { SidebarAccordionLink } from './sidebar-nav-accordion.component';
import { NavLinkProps, AccordionLinkProps } from './sidebar-nav.types';
import { isExternalLink } from './sidebar-nav.utils';
import { useNavLink, useAccordionLink } from './nav-link.hooks';

export type {
	NavLinkProps,
	AccordionLinkProps,
	SidebarItem
} from './sidebar-nav.types';

export const NavLink = (props: NavLinkProps) => {
	const {
		label,
		icon,
		subitems = [],
		whenMatched,
		dialogContent,
		disabled
	} = props;

	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const isSidebarOpen = !!isSidebarOpenRaw;
	const { isActive: isActiveRaw, to } = useNavLink(
		isExternalLink(props) ? undefined : props
	);
	const isActive = !!isActiveRaw;
	const hasSubitems = subitems.length > 0;

	const [isOpen, toggleOpen] = useState<boolean>(isActive);
	const isSubmenuOpen = isOpen && hasSubitems;

	const handleToggle = () => toggleOpen(!isOpen);
	const matchedOneTime = useRef(false);

	useEffect(() => {
		if (isActiveRaw) {
			toggleOpen(true);
			matchedOneTime.current = true;
		}
	}, [isActiveRaw, isSidebarOpenRaw]);

	useEffect(() => {
		if (!isSidebarOpenRaw && !isActiveRaw) {
			toggleOpen(false);
		}
	}, [isActiveRaw, isSidebarOpenRaw]);

	// Show dialog if whenMatched is set and not active, OR if disabled
	const shouldShowDialog =
		(whenMatched && !isActiveRaw && !matchedOneTime.current) || disabled;

	const toString =
		typeof to === 'object' && 'pathname' in to
			? `${to.pathname}${to.search ? `?${to.search}` : ''}`
			: String(to);

	return (
		<SidebarNavListWrapper isSubmenuOpen={isSubmenuOpen}>
			<SidebarNavLinkWrapper label={label}>
				<SidebarNavItemContainer
					isActive={isActive}
					isSubmenuOpen={isSubmenuOpen}
					className={disabled ? 'opacity-60' : ''}
				>
					{isExternalLink(props) ? (
						<SidebarNavExternalLink
							label={label}
							icon={icon}
							href={props.href}
							isActive={isActive}
						/>
					) : (
						<SidebarNavInternalLink
							label={label}
							icon={icon}
							to={toString}
							isActive={isActive}
							linkComponent={LinkWithProject}
							disabled={disabled}
						/>
					)}

					{dialogContent && (isSidebarOpen || disabled) ? (
						<SidebarNavInfoButton disabled={disabled}>
							{dialogContent}
						</SidebarNavInfoButton>
					) : null}

					{hasSubitems && !disabled && (
						<SidebarNavToggle
							isSubmenuOpen={isSubmenuOpen}
							isActive={isActive}
							onToggle={handleToggle}
						/>
					)}
				</SidebarNavItemContainer>
			</SidebarNavLinkWrapper>

			{hasSubitems && (
				<SidebarNavSubmenuContainer isSubmenuOpen={isSubmenuOpen}>
					{subitems.map((item) => (
						<AccordionLinkContainer key={item.label} {...item} />
					))}
				</SidebarNavSubmenuContainer>
			)}
		</SidebarNavListWrapper>
	);
};

const AccordionLinkContainer = (props: AccordionLinkProps) => {
	const { label, icon, whenMatched, dialogContent, disabled } = props;

	const { isSidebarOpen: isSidebarOpenRaw } = useSidebar();
	const {
		to,
		isActive: isActiveRaw,
		isPathMatch
	} = useAccordionLink(isExternalLink(props) ? undefined : props);
	const isActive = !!isActiveRaw;
	const matchedOneTime = useRef(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	useEffect(() => {
		if (isActiveRaw) matchedOneTime.current = true;
	}, [isActiveRaw, isSidebarOpenRaw]);

	// Show dialog if whenMatched and not active, OR if disabled
	const shouldShowDialog =
		(whenMatched && !isActiveRaw && !matchedOneTime.current && !isPathMatch) ||
		disabled;

	const handleClick = (e: React.MouseEvent) => {
		if (shouldShowDialog) {
			e.preventDefault();
			setIsDialogOpen(true);
		}
	};

	const toString =
		typeof to === 'object' && 'pathname' in to
			? `${to.pathname}${to.search ? `?${to.search}` : ''}`
			: String(to);

	return (
		<>
			{isExternalLink(props) ? (
				<SidebarAccordionLink
					label={label}
					icon={icon}
					href={props.href}
					isActive={isActive}
					disabled={disabled}
					dialogContent={dialogContent}
					onDialogOpen={
						shouldShowDialog ? () => setIsDialogOpen(true) : undefined
					}
				/>
			) : (
				<SidebarAccordionLink
					label={label}
					icon={icon}
					to={toString}
					isActive={isActive}
					disabled={disabled}
					linkComponent={LinkWithProject}
					onClick={handleClick}
					dialogContent={dialogContent}
					onDialogOpen={
						shouldShowDialog ? () => setIsDialogOpen(true) : undefined
					}
				/>
			)}

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogPortal>
					<ModalContent>
						{dialogContent || (
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
};
