/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { linkOptions } from '@tanstack/react-router';

import { useAuth } from '@/bublik/features/auth';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItemContainer,
	SidebarNavToggle
} from '@/bublik/features/sidebar-nav';
import { useGetServerFeaturesQuery } from '@/services/bublik-api';

const ADMIN_SIDEBAR_PATTERNS = [{ to: '/admin', fuzzy: true }];

/** The admin pages, checked against the route tree (`linkOptions`). */
const ADMIN_LINKS = {
	config: linkOptions({ to: '/admin/config' }).to,
	users: linkOptions({ to: '/admin/users' }).to,
	import: linkOptions({ to: '/admin/import' }).to,
	flower: linkOptions({ to: '/admin/flower' }).to,
	analytics: linkOptions({ to: '/admin/analytics' }).to
};

export function AdminSidebarNav() {
	const { isAdmin } = useAuth();
	const { data: features } = useGetServerFeaturesQuery();
	const showAnalytics = isAdmin && Boolean(features?.analytics_enabled);

	return (
		<SidebarNavCollapsibleContainer patterns={ADMIN_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Admin">
					<SidebarNavInternalLink
						to={ADMIN_LINKS.import}
						linkComponent={LinkWithProject}
					>
						<SidebarNavInternalLink.Icon name="Edit" />
						<SidebarNavInternalLink.Label>Admin</SidebarNavInternalLink.Label>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={ADMIN_LINKS.config}
					pattern={{ to: ADMIN_LINKS.config }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="SettingsSliders"
						size={24}
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Configs
					</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={ADMIN_LINKS.users}
					pattern={{ to: ADMIN_LINKS.users }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="TwoUsers" size={24} />
					<SidebarNavSubmenuItemContainer.Label>
						Users
					</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={ADMIN_LINKS.import}
					pattern={{ to: ADMIN_LINKS.import }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="Import" size={24} />
					<SidebarNavSubmenuItemContainer.Label>
						Import
					</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={ADMIN_LINKS.flower}
					pattern={{ to: ADMIN_LINKS.flower }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="LineChartOnline"
						size={24}
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Flower
					</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				{showAnalytics ? (
					<SidebarNavSubmenuItemContainer
						to={ADMIN_LINKS.analytics}
						pattern={{ to: ADMIN_LINKS.analytics }}
						linkComponent={LinkWithProject}
					>
						<SidebarNavSubmenuItemContainer.Icon
							name="LineChartOnline"
							size={24}
						/>
						<SidebarNavSubmenuItemContainer.Label>
							Analytics
						</SidebarNavSubmenuItemContainer.Label>
					</SidebarNavSubmenuItemContainer>
				) : null}
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
