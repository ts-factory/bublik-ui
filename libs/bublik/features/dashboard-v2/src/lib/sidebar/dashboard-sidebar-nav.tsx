/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavCollapsibleContainer,
	useIsActivePaths
} from '@/bublik/features/sidebar-nav';
import { useDashboardSidebarState } from './use-dashboard-sidebar-state';

export function DashboardSidebarNav() {
	const location = useLocation();
	const { mainLinkUrl, setLastUrl } = useDashboardSidebarState();

	const isActive = useIsActivePaths([{ path: '/dashboard' }]);

	useEffect(() => {
		const isDashboardPage = matchPath('/dashboard', location.pathname);

		if (isDashboardPage) {
			setLastUrl(location.pathname + location.search);
		}
	}, [location.pathname, location.search, setLastUrl]);

	return (
		<SidebarNavCollapsibleContainer.Item isActive={isActive}>
			<SidebarNavLinkWrapper label="Dashboard">
				<SidebarNavInternalLink
					label="Dashboard"
					icon={<Icon name="Category" />}
					to={mainLinkUrl}
					isActive={isActive}
					linkComponent={LinkWithProject}
				/>
			</SidebarNavLinkWrapper>
		</SidebarNavCollapsibleContainer.Item>
	);
}
