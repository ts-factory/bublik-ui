/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect } from 'react';
import { matchRoutePath, useRenderedLocation } from '@/router';

import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavInternalLink,
	SidebarNavItem,
	SidebarNavLinkWrapper,
	type ActivePattern
} from '@/bublik/features/sidebar-nav';

import { useIssueSidebarState } from './issue-sidebar.hooks';

const ISSUE_DETAIL_PATTERN: ActivePattern = { to: '/issues/$issueId' };

const ISSUE_DETAIL_PATTERNS: ActivePattern[] = [ISSUE_DETAIL_PATTERN];

const NO_PATTERNS: ActivePattern[] = [];

export function IssueSidebarNav() {
	const { pathname, searchStr } = useRenderedLocation();
	const { mainLinkUrl, isAvailable, setLastVisited } = useIssueSidebarState();

	// `/issues/rules` matches the route path too: only a numeric id is an issue.
	const match = matchRoutePath(ISSUE_DETAIL_PATTERN, pathname);
	const issueId = match ? match['issueId'] : undefined;
	const isIssueDetail = !!issueId && /^\d+$/.test(issueId);

	useEffect(() => {
		if (!isIssueDetail) return;

		setLastVisited(pathname + searchStr);
	}, [isIssueDetail, pathname, searchStr, setLastVisited]);

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
