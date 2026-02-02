/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useRef, useState } from 'react';

import { useSidebar } from '@/shared/tailwind-ui';
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
import { isExternalLink, toString } from './sidebar-nav.utils';
import { useNavLink, useAccordionLink } from './nav-link.hooks';

export type {
	NavLinkProps,
	AccordionLinkProps,
	SidebarItem
} from './sidebar-nav.types';

export const NavLink = (props: NavLinkProps) => {
	const { label, icon, subitems = [], dialogContent, disabled } = props;

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

	const url = toString(to);

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
							to={url}
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
	const { label, icon, dialogContent, disabled } = props;

	const { to, isActive: isActiveRaw } = useAccordionLink(
		isExternalLink(props) ? undefined : props
	);
	const isActive = !!isActiveRaw;

	const url = toString(to);

	return isExternalLink(props) ? (
		<SidebarAccordionLink
			label={label}
			icon={icon}
			href={props.href}
			isActive={isActive}
			disabled={disabled}
			dialogContent={dialogContent}
		/>
	) : (
		<SidebarAccordionLink
			label={label}
			icon={icon}
			to={url}
			isActive={isActive}
			disabled={disabled}
			linkComponent={LinkWithProject}
			dialogContent={dialogContent}
		/>
	);
};
