/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

import { LinkWithProject, useProjectSearch } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItemContainer,
	SidebarNavToggle
} from '@/bublik/features/sidebar-nav';

import { useIssuesSidebarState } from './issues-sidebar.hooks';
import { OpenIssueCountBadge } from './open-issue-count-badge.component';

const ISSUES_SIDEBAR_PATTERNS = [
	{ path: '/issues' },
	{ path: '/issues/rules' }
];

function openIssuesTooltip(count: number, isProjectPicked: boolean): string {
	const noun = count === 1 ? 'open issue' : 'open issues';
	const scope = isProjectPicked ? 'in the selected project' : 'in all projects';

	return `${count} ${noun} ${scope}`;
}

export function IssuesSidebarNav() {
	const location = useLocation();
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
						<SidebarNavInternalLink.Icon name="IssueIcon" className="size-7" />
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
							isActive={matchPath('/issues', location.pathname) !== null}
							testId="issues-sidebar-open-count"
						/>
					) : null}
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
