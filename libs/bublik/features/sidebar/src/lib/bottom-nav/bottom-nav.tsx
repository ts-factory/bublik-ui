/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useMemo } from 'react';

import { useAuth } from '@/bublik/features/auth';
import { Icon } from '@/shared/tailwind-ui';

import { NavLink, SidebarItem } from '../nav-link';

const getNavSections = (isAdmin: boolean) => {
	const devSection: SidebarItem = {
		label: 'Admin',
		icon: <Icon name="Edit" />,
		to: '/admin/import',
		pattern: [{ path: '/admin/*' }],
		subitems: [
			{
				label: 'Configs',
				icon: <Icon name="SettingsSliders" size={20} />,
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
				label: 'Performance',
				icon: <Icon name="TimeCircle" size={24} />,
				to: '/admin/performance',
				pattern: { path: '/admin/performance' }
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
		]
	};

	const bottomNav: SidebarItem[] = [
		{
			label: 'Account',
			icon: <Icon name="Profile" size={28} />,
			to: '/settings/profile',
			pattern: { path: '/settings/*' }
		},
		{
			label: 'Help',
			icon: <Icon name="Bulb" size={28} />,
			to: '/help/faq',
			pattern: [{ path: '/help', end: false }, { path: '/help/faq' }],
			subitems: [
				{
					label: 'Changelog',
					icon: <Icon name="PaperChangelog" />,
					to: '/help/changelog',
					pattern: { path: '/help/changelog' }
				}
			]
		}
	];

	return [devSection, ...bottomNav];
};

export const BottomNavigation = () => {
	const { isAdmin } = useAuth();

	const links = useMemo(() => getNavSections(isAdmin), [isAdmin]);

	return (
		<ul className="flex flex-col gap-3">
			{links.map((item) => (
				<li key={item.label}>
					<NavLink {...item} />
				</li>
			))}
		</ul>
	);
};
