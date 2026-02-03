/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItem,
	SidebarNavToggle
} from '@/bublik/features/sidebar-nav';
import { config } from '@/bublik/config';

const HELP_SIDEBAR_PATTERNS = [
	{ path: '/help', end: false },
	{ path: '/help/faq' }
];

export function HelpSidebarNav() {
	return (
		<SidebarNavCollapsibleContainer patterns={HELP_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Help">
					<SidebarNavInternalLink
						label="Help"
						icon={<Icon name="Bulb" size={28} />}
						to="/help/faq"
						linkComponent={LinkWithProject}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItem
					href={`${config.oldBaseUrl}/docs`}
					isActive={false}
				>
					<Icon name="PaperText" />
					<span className="truncate text-[0.875rem] leading-[1.5rem]">Documentation</span>
				</SidebarNavSubmenuItem>
				<SidebarNavSubmenuItem
					href={`${config.oldBaseUrl}/docs/blog`}
					isActive={false}
				>
					<Icon name="PaperChangelog" />
					<span className="truncate text-[0.875rem] leading-[1.5rem]">Changelog</span>
				</SidebarNavSubmenuItem>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
