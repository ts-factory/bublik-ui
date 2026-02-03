/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { ReactNode } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItem,
	SidebarNavToggle,
	useIsActivePaths
} from '@/bublik/features/sidebar-nav';

export function AdminSidebarNav() {
	const isActive = useIsActivePaths([{ path: '/admin/*' }]);

	return (
		<SidebarNavCollapsibleContainer isActive={isActive}>
			<SidebarNavCollapsibleContainer.Item isActive={isActive}>
				<SidebarNavLinkWrapper label="Admin">
					<SidebarNavInternalLink
						label="Admin"
						icon={<Icon name="Edit" />}
						to="/admin/import"
						isActive={isActive}
						linkComponent={LinkWithProject}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle isActive={isActive} />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<AdminSubmenuItem
					label="Configs"
					icon={<Icon name="SettingsSliders" size={24} />}
					to="/admin/config"
					pattern={{ path: '/admin/config' }}
				/>
				<AdminSubmenuItem
					label="Users"
					icon={<Icon name="TwoUsers" size={24} />}
					to="/admin/users"
					pattern={{ path: '/admin/users' }}
				/>
				<AdminSubmenuItem
					label="Import"
					icon={<Icon name="Import" size={24} />}
					to="/admin/import"
					pattern={{ path: '/admin/import' }}
				/>
				<AdminSubmenuItem
					label="Flower"
					icon={<Icon name="LineChartOnline" size={24} />}
					to="/admin/flower"
					pattern={{ path: '/admin/flower' }}
				/>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}

interface AdminSubmenuItemProps {
	label: string;
	icon: ReactNode;
	to: string;
	pattern: { path: string };
}

function AdminSubmenuItem({ label, icon, to, pattern }: AdminSubmenuItemProps) {
	const location = useLocation();
	const isActive = !!matchPath(pattern.path, location.pathname);

	return (
		<SidebarNavSubmenuItem
			label={label}
			icon={icon}
			to={to}
			isActive={isActive}
			linkComponent={LinkWithProject}
		/>
	);
}
