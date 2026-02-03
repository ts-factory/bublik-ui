/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItem,
	SidebarNavToggle,
	useIsActivePaths
} from '@/bublik/features/sidebar-nav';
import { config } from '@/bublik/config';

export function HelpSidebarNav() {
	const isActive = useIsActivePaths([
		{ path: '/help', end: false },
		{ path: '/help/faq' }
	]);

	return (
		<SidebarNavCollapsibleContainer isActive={isActive}>
			<SidebarNavCollapsibleContainer.Item isActive={isActive}>
				<SidebarNavLinkWrapper label="Help">
					<SidebarNavInternalLink
						label="Help"
						icon={<Icon name="Bulb" size={28} />}
						to="/help/faq"
						isActive={isActive}
						linkComponent={LinkWithProject}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle isActive={isActive} />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItem
					label="Documentation"
					icon={<Icon name="PaperText" />}
					href={`${config.oldBaseUrl}/docs`}
					isActive={false}
				/>
				<SidebarNavSubmenuItem
					label="Changelog"
					icon={<Icon name="PaperChangelog" />}
					href={`${config.oldBaseUrl}/docs/blog`}
					isActive={false}
				/>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
