/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { InstructionDialog } from '@/shared/tailwind-ui';

import dashboardSidebar from './images/dashboard-sidebar.webp';
import dashboardLinks from './images/dashboard-links.webp';
import dashboardControls from './images/dashboard-hints.webp';

export function DashboardDialog() {
	return (
		<InstructionDialog
			dialogTitle="Dashboard"
			dialogDescription="Follow these steps to view dashboard."
			steps={[
				{
					title: 'You can visit dashboard from the sidebar',
					description: 'Visit the sidebar to view the dashboard.',
					image: dashboardSidebar
				},
				{
					title: 'You can view dashboard links',
					description: 'You can view the dashboard links.',
					image: dashboardLinks
				},
				{
					title: 'Dashboard Controls',
					description: 'You can view the dashboard controls.',
					image: dashboardControls
				}
			]}
		/>
	);
}
