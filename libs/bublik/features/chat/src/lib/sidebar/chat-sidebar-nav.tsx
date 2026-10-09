/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { RouterLinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavItem
} from '@/bublik/features/sidebar-nav';
import { useGetServerFeaturesQuery } from '@/services/bublik-api';
import type { RoutePathPattern } from '@/router';

import { useChatPath } from '../chat-path';

// `/chat` and `/chat/<thread>`: the thread id is optional
const CHAT_SIDEBAR_PATTERNS: RoutePathPattern[] = [
	{ to: '/chat/{-$threadId}' }
];

export function ChatSidebarNav() {
	const { data: features } = useGetServerFeaturesQuery();
	const chatPath = useChatPath();

	if (!features?.chat_enabled) return null;

	return (
		<SidebarNavItem patterns={CHAT_SIDEBAR_PATTERNS}>
			<SidebarNavLinkWrapper label="Assistant">
				<SidebarNavInternalLink
					to={chatPath()}
					linkComponent={RouterLinkWithProject}
				>
					<SidebarNavInternalLink.Icon name="Chat" />
					<SidebarNavInternalLink.Label>Chat</SidebarNavInternalLink.Label>
				</SidebarNavInternalLink>
			</SidebarNavLinkWrapper>
		</SidebarNavItem>
	);
}
