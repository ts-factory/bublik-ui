/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import {
	matchRoutePath,
	useRenderedLocation,
	type RoutePathPattern
} from '@/router';

import { RouterLinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavItem
} from '@/bublik/features/sidebar-nav';
import { useDashboardSidebarState } from './use-dashboard-sidebar-state';

const DASHBOARD_SIDEBAR_PATTERNS: RoutePathPattern[] = [{ to: '/dashboard' }];

export function DashboardSidebarNav() {
	const { pathname, searchStr } = useRenderedLocation();
	const { mainLinkUrl, setLastUrl } = useDashboardSidebarState();

	// Remembers the dashboard view on screen for the sidebar link (`_s`).
	useEffect(() => {
		const isDashboardPage = matchRoutePath({ to: '/dashboard' }, pathname);

		if (isDashboardPage) {
			setLastUrl(pathname + searchStr);
		}
	}, [pathname, searchStr, setLastUrl]);

	return (
		<SidebarNavItem patterns={DASHBOARD_SIDEBAR_PATTERNS}>
			<SidebarNavLinkWrapper label="Dashboard">
				<SidebarNavInternalLink
					to={mainLinkUrl}
					linkComponent={RouterLinkWithProject}
				>
					<SidebarNavInternalLink.Icon name="Category" />
					<SidebarNavInternalLink.Label>Dashboard</SidebarNavInternalLink.Label>
				</SidebarNavInternalLink>
			</SidebarNavLinkWrapper>
		</SidebarNavItem>
	);
}
