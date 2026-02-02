/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Icon } from '@/shared/tailwind-ui';
import { NavLink } from '@/bublik/features/sidebar-nav';
import { config } from '@/bublik/config';

export function HelpSidebarNav() {
	return (
		<NavLink
			label="Help"
			icon={<Icon name="Bulb" size={28} />}
			to="/help/faq"
			pattern={[{ path: '/help', end: false }, { path: '/help/faq' }]}
			subitems={[
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
			]}
		/>
	);
}
