/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { MouseEventHandler, ReactNode } from 'react';
import type { To } from 'react-router-dom';

export type { LinkProps } from 'react-router-dom';

export type SearchPattern = Record<string, string>;

export type MatchPattern = {
	path?: string;
	search?: SearchPattern;
	end?: boolean;
	caseSensitive?: boolean;
};

export type NavLinkCommon = {
	label: string;
	icon: ReactNode;
	subitems?: AccordionLinkProps[];
	whenMatched?: boolean;
	dialogContent?: ReactNode;
	disabled?: boolean;
};

export type NavLinkInternal = {
	to: To;
	pattern?: MatchPattern | MatchPattern[];
} & NavLinkCommon;

export type NavLinkExternal = {
	href: string;
} & NavLinkCommon;

export type NavLinkProps = (NavLinkInternal | NavLinkExternal) & {
	disabled?: boolean;
};
export type AccordionLinkProps = (NavLinkInternal | NavLinkExternal) & {
	disabled?: boolean;
};
export type SidebarItem = NavLinkProps;

export type SidebarNavLinkBaseProps = {
	label: string;
	icon: ReactNode;
	isActive: boolean;
	isSidebarOpen: boolean;
	isSubmenuOpen?: boolean;
	dialogContent?: ReactNode;
	hasSubitems?: boolean;
	onDialogOpen?: () => void;
	disabled?: boolean;
};

export type SidebarNavLinkInternalProps = SidebarNavLinkBaseProps & {
	to: To;
	linkComponent?: React.ForwardRefExoticComponent<
		{
			to: To;
			className?: string;
			style?: React.CSSProperties;
			children: ReactNode;
			onClick?: MouseEventHandler<HTMLAnchorElement>;
		} & React.RefAttributes<HTMLAnchorElement>
	>;
	onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export type SidebarNavLinkExternalProps = SidebarNavLinkBaseProps & {
	href: string;
};

export type SidebarAccordionLinkProps = {
	label: string;
	icon: ReactNode;
	isActive: boolean;
	isSidebarOpen: boolean;
	dialogContent?: ReactNode;
	onDialogOpen?: () => void;
	disabled?: boolean;
} & (
	| {
			to: To;
			linkComponent?: React.ForwardRefExoticComponent<
				{
					to: To;
					className?: string;
					style?: React.CSSProperties;
					children: ReactNode;
					onClick?: MouseEventHandler<HTMLAnchorElement>;
				} & React.RefAttributes<HTMLAnchorElement>
			>;
			onClick?: MouseEventHandler<HTMLAnchorElement>;
	  }
	| { href: string }
);

export type SidebarNavSubmenuProps = {
	isSubmenuOpen: boolean;
	isSidebarOpen: boolean;
	children: ReactNode;
};

export type SidebarNavToggleProps = {
	isSubmenuOpen: boolean;
	isSidebarOpen: boolean;
	isActive: boolean;
	onToggle: () => void;
};
