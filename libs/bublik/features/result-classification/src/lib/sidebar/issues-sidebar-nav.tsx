/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItemContainer,
	SidebarNavToggle
} from '@/bublik/features/sidebar-nav';

import { useIssuesSidebarState } from './use-issues-sidebar-state';

/**
 * Both list paths, spelled out rather than `/issues/*`.
 *
 * `matchPath` defaults to `end: true`, so `/issues` alone would not match
 * `/issues/rules`. A splat would match `/issues/:issueId` too and overlap the
 * Issue section — and `useSidebarStateWriter` writes a whole search string
 * rather than applying a functional update, so two nav writers firing in the
 * same commit would clobber each other.
 */
const ISSUES_SIDEBAR_PATTERNS = [
	{ path: '/issues' },
	{ path: '/issues/rules' }
];

export function IssuesSidebarNav() {
	const location = useLocation();
	const { listUrl, rulesUrl, mainLinkUrl, setLastVisited } =
		useIssuesSidebarState();

	useEffect(() => {
		if (matchPath('/issues/rules', location.pathname)) {
			setLastVisited('rules', location.pathname + location.search);
		} else if (matchPath('/issues', location.pathname)) {
			setLastVisited('issues', location.pathname + location.search);
		}
	}, [location.pathname, location.search, setLastVisited]);

	return (
		<SidebarNavCollapsibleContainer patterns={ISSUES_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Issues">
					<SidebarNavInternalLink
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
					>
						<SidebarNavInternalLink.Icon name="TriangleExclamationMark" />
						<SidebarNavInternalLink.Label>Issues</SidebarNavInternalLink.Label>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={listUrl}
					pattern={{ path: '/issues' }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="PaperListText"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Issues
					</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={rulesUrl}
					pattern={{ path: '/issues/rules' }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="SettingsSliders"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Rules
					</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
