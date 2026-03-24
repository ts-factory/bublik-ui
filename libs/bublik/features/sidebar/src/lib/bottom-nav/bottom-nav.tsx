/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { Icon } from '@/shared/tailwind-ui';
import { config } from '@/bublik/config';
import { useAuth } from '@/bublik/features/auth';
import { useGetServerFeaturesQuery } from '@/services/bublik-api';

import { SettingsModal } from '@/bublik/features/settings';

import { NavLink, SidebarItem } from '../nav-link';

interface GetNavSectionsArgs {
	isAdmin: boolean;
	isAnalyticsEnabled: boolean;
}

const getNavSections = ({
	isAdmin,
	isAnalyticsEnabled
}: GetNavSectionsArgs) => {
	const adminSubitems: SidebarItem[] = [
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
	];

	if (isAdmin && isAnalyticsEnabled) {
		adminSubitems.push({
			label: 'Analytics',
			icon: <Icon name="LineChartSingle" size={24} />,
			to: '/admin/analytics',
			pattern: { path: '/admin/analytics' }
		});
	}

	const devSection: SidebarItem = {
		label: 'Admin',
		icon: <Icon name="Edit" />,
		to: '/admin/import',
		pattern: [{ path: '/admin/*' }],
		subitems: adminSubitems
	};

	const bottomNav: SidebarItem[] = [
		{
			label: 'Help',
			icon: <Icon name="Bulb" size={28} />,
			to: '/help/faq',
			pattern: [{ path: '/help', end: false }, { path: '/help/faq' }],
			subitems: [
				{
					label: 'Documentation',
					icon: <Icon name="PaperText" />,
					href: `${config.oldBaseUrl}/docs`
				},
				{
					label: 'Changelog',
					icon: <Icon name="PaperChangelog" />,
					href: `${config.oldBaseUrl}/docs/blog`
				}
			]
		}
	];

	return [devSection, ...bottomNav];
};

export const BottomNavigation = () => {
	const { isAdmin } = useAuth();
	const { data: features } = useGetServerFeaturesQuery();

	const links = getNavSections({
		isAdmin,
		isAnalyticsEnabled: Boolean(features?.analytics_enabled)
	});

	return (
		<ul className="flex flex-col gap-3">
			<li>
				<SettingsModal />
			</li>
			{links.map((item) => (
				<li key={item.label}>
					<NavLink {...item} />
				</li>
			))}
		</ul>
	);
};
