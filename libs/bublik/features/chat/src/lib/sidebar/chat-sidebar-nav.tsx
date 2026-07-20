/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavItem
} from '@/bublik/features/sidebar-nav';
import { useGetServerFeaturesQuery } from '@/services/bublik-api';

const CHAT_SIDEBAR_PATTERNS = [{ path: '/chat' }, { path: '/chat/:threadId' }];

export function ChatSidebarNav() {
	const { data: features } = useGetServerFeaturesQuery();

	if (!features?.chat_enabled) return null;

	return (
		<SidebarNavItem patterns={CHAT_SIDEBAR_PATTERNS}>
			<SidebarNavLinkWrapper label="Assistant">
				<SidebarNavInternalLink to="/chat" linkComponent={LinkWithProject}>
					<SidebarNavInternalLink.Icon name="Chat" />
					<SidebarNavInternalLink.Label>Chat</SidebarNavInternalLink.Label>
				</SidebarNavInternalLink>
			</SidebarNavLinkWrapper>
		</SidebarNavItem>
	);
}
