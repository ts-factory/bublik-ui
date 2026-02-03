/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItem,
	SidebarNavToggle,
	getSubmenuIsActive
} from '@/bublik/features/sidebar-nav';

const ADMIN_SIDEBAR_PATTERNS = [{ path: '/admin/*' }];

export function AdminSidebarNav() {
	return (
		<SidebarNavCollapsibleContainer patterns={ADMIN_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Admin">
					<SidebarNavInternalLink
						label="Admin"
						icon={<Icon name="Edit" />}
						to="/admin/import"
						linkComponent={LinkWithProject}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
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
	const isActive = getSubmenuIsActive(location, { path: pattern.path });

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
