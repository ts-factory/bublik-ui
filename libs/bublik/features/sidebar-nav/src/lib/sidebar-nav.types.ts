/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { MouseEventHandler, ReactNode } from 'react';
import type { To } from 'react-router-dom';

export type { LinkProps } from 'react-router-dom';

export type SidebarNavLinkBaseProps = {
	label: string;
	icon: ReactNode;
	isActive?: boolean;
	isSidebarOpen: boolean;
	isSubmenuOpen?: boolean;
	dialogContent?: ReactNode;
	hasSubitems?: boolean;
	onDialogOpen?: () => void;
	disabled?: boolean;
};

export type SidebarNavLinkInternalProps = Omit<
	SidebarNavLinkBaseProps,
	'label' | 'icon'
> & {
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
