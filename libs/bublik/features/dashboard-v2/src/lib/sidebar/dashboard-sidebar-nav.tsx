/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Icon } from '@/shared/tailwind-ui';
import { NavLink } from '@/bublik/features/sidebar-nav';

import { DashboardDialog } from './dashboard-dialog';

export function DashboardSidebarNav() {
	return (
		<NavLink
			label="Dashboard"
			to="/dashboard"
			icon={<Icon name="Category" />}
			pattern={{ path: '/dashboard' }}
			dialogContent={<DashboardDialog />}
		/>
	);
}
