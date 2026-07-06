/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavItem
} from '@/bublik/features/sidebar-nav';
import { useDashboardSidebarState } from './use-dashboard-sidebar-state';

const DASHBOARD_SIDEBAR_PATTERNS = [{ path: '/dashboard' }];

export function DashboardSidebarNav() {
	const location = useLocation();
	const { mainLinkUrl, setLastUrl } = useDashboardSidebarState();

	useEffect(() => {
		const isDashboardPage = matchPath('/dashboard', location.pathname);

		if (isDashboardPage) {
			setLastUrl(location.pathname + location.search);
		}
	}, [location.pathname, location.search, setLastUrl]);

	return (
		<SidebarNavItem patterns={DASHBOARD_SIDEBAR_PATTERNS}>
			<SidebarNavLinkWrapper label="Dashboard">
				<SidebarNavInternalLink
					to={mainLinkUrl}
					linkComponent={LinkWithProject}
				>
					<SidebarNavInternalLink.Icon name="Category" />
					<SidebarNavInternalLink.Label>Dashboard</SidebarNavInternalLink.Label>
				</SidebarNavInternalLink>
			</SidebarNavLinkWrapper>
		</SidebarNavItem>
	);
}
