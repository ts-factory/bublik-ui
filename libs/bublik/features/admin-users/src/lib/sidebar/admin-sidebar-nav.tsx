/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Icon } from '@/shared/tailwind-ui';
import { NavLink } from '@/bublik/features/sidebar-nav';

export function AdminSidebarNav() {
	return (
		<NavLink
			label="Admin"
			icon={<Icon name="Edit" />}
			to="/admin/import"
			pattern={[{ path: '/admin/*' }]}
			subitems={[
				{
					label: 'Configs',
					icon: <Icon name="SettingsSliders" size={24} />,
					to: '/admin/config',
					pattern: { path: '/admin/config' }
				},
				{
					label: 'Users',
					icon: <Icon name="TwoUsers" size={24} />,
					to: '/admin/users',
					pattern: { path: '/admin/users' }
				},
				{
					label: 'Import',
					icon: <Icon name="Import" size={24} />,
					to: '/admin/import',
					pattern: { path: '/admin/import' }
				},
				{
					label: 'Flower',
					icon: <Icon name="LineChartOnline" size={24} />,
					to: '/admin/flower',
					pattern: { path: '/admin/flower' }
				}
			]}
		/>
	);
}
