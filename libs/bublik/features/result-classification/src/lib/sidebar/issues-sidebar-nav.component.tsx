/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect } from 'react';
import {
	matchRoutePath,
	useRenderedLocation,
	type RoutePathPattern
} from '@/router';

import {
	RouterLinkWithProject,
	useProjectSearch
} from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItemContainer,
	SidebarNavToggle
} from '@/bublik/features/sidebar-nav';

import { useIssuesSidebarState } from './issues-sidebar.hooks';
import { OpenIssueCountBadge } from './open-issue-count-badge.component';

const LIST_PATTERN: RoutePathPattern = { to: '/issues' };
const RULES_PATTERN: RoutePathPattern = { to: '/issues/rules' };
const ISSUES_SIDEBAR_PATTERNS: RoutePathPattern[] = [
	LIST_PATTERN,
	RULES_PATTERN
];

function openIssuesTooltip(count: number, isProjectPicked: boolean): string {
	const noun = count === 1 ? 'open issue' : 'open issues';
	const scope = isProjectPicked ? 'in the selected project' : 'in all projects';

	return `${count} ${noun} ${scope}`;
}

export function IssuesSidebarNav() {
	const { pathname, searchStr } = useRenderedLocation();
	const { projectIds } = useProjectSearch();
	const {
		listUrl,
		rulesUrl,
		mainLinkUrl,
		openIssueCount,
		isOpenIssueCountLoading,
		setLastVisited
	} = useIssuesSidebarState();

	useEffect(() => {
		if (matchRoutePath(RULES_PATTERN, pathname)) {
			setLastVisited('rules', pathname + searchStr);
		} else if (matchRoutePath(LIST_PATTERN, pathname)) {
			setLastVisited('issues', pathname + searchStr);
		}
	}, [pathname, searchStr, setLastVisited]);

	return (
		<SidebarNavCollapsibleContainer patterns={ISSUES_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Issues">
					<SidebarNavInternalLink
						to={mainLinkUrl}
						linkComponent={RouterLinkWithProject}
					>
						<SidebarNavInternalLink.Icon name="IssueIcon" className="size-7" />
						<SidebarNavInternalLink.Label>Issues</SidebarNavInternalLink.Label>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={listUrl}
					pattern={LIST_PATTERN}
					linkComponent={RouterLinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="IssueIcon"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Issues
					</SidebarNavSubmenuItemContainer.Label>
					{!isOpenIssueCountLoading && openIssueCount > 0 ? (
						<OpenIssueCountBadge
							count={openIssueCount}
							tooltip={openIssuesTooltip(openIssueCount, projectIds.length > 0)}
							isActive={matchRoutePath(LIST_PATTERN, pathname) !== false}
							testId="issues-sidebar-open-count"
						/>
					) : null}
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={rulesUrl}
					pattern={RULES_PATTERN}
					linkComponent={RouterLinkWithProject}
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
