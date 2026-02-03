/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItemContainer,
	SidebarNavToggle
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
				<SidebarNavSubmenuItemContainer
					to="/admin/config"
					pattern={{ path: '/admin/config' }}
					linkComponent={LinkWithProject}
				>
					<Icon name="SettingsSliders" size={24} />
					<SidebarNavSubmenuItemContainer.Label>Configs</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to="/admin/users"
					pattern={{ path: '/admin/users' }}
					linkComponent={LinkWithProject}
				>
					<Icon name="TwoUsers" size={24} />
					<SidebarNavSubmenuItemContainer.Label>Users</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to="/admin/import"
					pattern={{ path: '/admin/import' }}
					linkComponent={LinkWithProject}
				>
					<Icon name="Import" size={24} />
					<SidebarNavSubmenuItemContainer.Label>Import</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to="/admin/flower"
					pattern={{ path: '/admin/flower' }}
					linkComponent={LinkWithProject}
				>
					<Icon name="LineChartOnline" size={24} />
					<SidebarNavSubmenuItemContainer.Label>Flower</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
