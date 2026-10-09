/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavInternalLink,
	SidebarNavItem,
	SidebarNavLinkWrapper,
	type ActivePattern
} from '@/bublik/features/sidebar-nav';

import { useIssueSidebarState } from './issue-sidebar.hooks';

const ISSUE_DETAIL_PATTERNS: ActivePattern[] = [{ path: '/issues/:issueId' }];

const NO_PATTERNS: ActivePattern[] = [];

export function IssueSidebarNav() {
	const location = useLocation();
	const { mainLinkUrl, isAvailable, setLastVisited } = useIssueSidebarState();

	const match = matchPath('/issues/:issueId', location.pathname);
	const issueId = match?.params.issueId;
	const isIssueDetail = !!issueId && /^\d+$/.test(issueId);

	useEffect(() => {
		if (!isIssueDetail) return;

		setLastVisited(location.pathname + location.search);
	}, [isIssueDetail, location.pathname, location.search, setLastVisited]);

	return (
		<SidebarNavItem
			patterns={isIssueDetail ? ISSUE_DETAIL_PATTERNS : NO_PATTERNS}
		>
			<SidebarNavLinkWrapper label="Issue">
				<SidebarNavInternalLink
					to={mainLinkUrl}
					linkComponent={LinkWithProject}
					disabled={!isAvailable}
				>
					<SidebarNavInternalLink.Icon name="Paper" />
					<SidebarNavInternalLink.Label>Issue</SidebarNavInternalLink.Label>
				</SidebarNavInternalLink>
			</SidebarNavLinkWrapper>
		</SidebarNavItem>
	);
}
