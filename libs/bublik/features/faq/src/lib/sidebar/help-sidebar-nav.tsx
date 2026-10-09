/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { linkOptions } from '@tanstack/react-router';

import { Icon } from '@/shared/tailwind-ui';
import { RouterLinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItem,
	SidebarNavSubmenuItemContainer,
	SidebarNavToggle
} from '@/bublik/features/sidebar-nav';
import { config } from '@/bublik/config';
import type { RoutePathPattern } from '@/router';

// The help page's address, checked against the route tree.
const HELP_FAQ = linkOptions({ to: '/help/faq' });

// Every help page; bare `/help` is no page of its own
const HELP_SIDEBAR_PATTERNS: RoutePathPattern[] = [
	{ to: HELP_FAQ.to, fuzzy: true }
];

export function HelpSidebarNav() {
	return (
		<SidebarNavCollapsibleContainer patterns={HELP_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Help">
					<SidebarNavInternalLink
						to={HELP_FAQ.to}
						linkComponent={RouterLinkWithProject}
					>
						<SidebarNavInternalLink.Icon name="Bulb" size={28} />
						<SidebarNavInternalLink.Label>Help</SidebarNavInternalLink.Label>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={HELP_FAQ.to}
					pattern={{ to: HELP_FAQ.to }}
					linkComponent={RouterLinkWithProject}
				>
					<Icon name="InformationCircleQuestionMark" className="size-7" />
					<SidebarNavSubmenuItemContainer.Label>
						FAQ
					</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItem
					href={`${config.oldBaseUrl}/docs`}
					isActive={false}
				>
					<Icon name="PaperText" />
					<span className="truncate text-[0.875rem] leading-[1.5rem]">
						Documentation
					</span>
				</SidebarNavSubmenuItem>
				<SidebarNavSubmenuItem
					href={`${config.oldBaseUrl}/docs/blog`}
					isActive={false}
				>
					<Icon name="PaperChangelog" />
					<span className="truncate text-[0.875rem] leading-[1.5rem]">
						Changelog
					</span>
				</SidebarNavSubmenuItem>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
