/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavItem
} from '@/bublik/features/sidebar-nav';
import { useGetServerFeaturesQuery } from '@/services/bublik-api';

import { useChatSidebarState } from './use-chat-sidebar-state';

const CHAT_SIDEBAR_PATTERNS = [{ path: '/chat' }, { path: '/chat/:threadId' }];

export function ChatSidebarNav() {
	const location = useLocation();
	const { data: features } = useGetServerFeaturesQuery();
	const { mainLinkUrl, setLastUrl } = useChatSidebarState();

	// Remember the open thread so the Chat link brings it back after a visit
	// elsewhere. Bare `/chat` is skipped: the page replaces it with a fresh
	// thread URL straight away, which is recorded instead.
	useEffect(() => {
		if (matchPath('/chat/:threadId', location.pathname)) {
			setLastUrl(location.pathname + location.search);
		}
	}, [location.pathname, location.search, setLastUrl]);

	if (!features?.chat_enabled) return null;

	return (
		<SidebarNavItem patterns={CHAT_SIDEBAR_PATTERNS}>
			<SidebarNavLinkWrapper label="Assistant">
				<SidebarNavInternalLink
					to={mainLinkUrl}
					linkComponent={LinkWithProject}
				>
					<SidebarNavInternalLink.Icon name="Chat" />
					<SidebarNavInternalLink.Label>Chat</SidebarNavInternalLink.Label>
				</SidebarNavInternalLink>
			</SidebarNavLinkWrapper>
		</SidebarNavItem>
	);
}
