/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect } from 'react';
import { matchRoutePath, useRenderedLocation } from '@/router';

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
import { SidebarCountBadge } from './sidebar-count-badge.component';

const LIST_PATTERN = { to: '/issues' };
const RULES_PATTERN = { to: '/issues/rules' };
const ISSUES_SIDEBAR_PATTERNS = [LIST_PATTERN, RULES_PATTERN];

function scopeOf(isProjectPicked: boolean): string {
	return isProjectPicked ? 'in the selected project' : 'in all projects';
}

function openIssuesTooltip(count: number, isProjectPicked: boolean): string {
	const noun = count === 1 ? 'open issue' : 'open issues';

	return `${count} ${noun} ${scopeOf(isProjectPicked)}`;
}

function totalTooltip(
	count: number,
	singular: string,
	plural: string,
	isProjectPicked: boolean
): string {
	return `${count} ${count === 1 ? singular : plural} ${scopeOf(
		isProjectPicked
	)}`;
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
		ruleCount,
		isRuleCountLoading,
		setLastVisited
	} = useIssuesSidebarState();
	const isProjectPicked = projectIds.length > 0;
	const isOnIssues = matchRoutePath(LIST_PATTERN, pathname) !== false;
	const isOnRules = matchRoutePath(RULES_PATTERN, pathname) !== false;

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
					pattern={LIST_PATTERN}
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
							tooltip={openIssuesTooltip(openIssueCount, isProjectPicked)}
							isActive={isOnIssues}
							testId="issues-sidebar-open-count"
						/>
					) : null}
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={rulesUrl}
					pattern={RULES_PATTERN}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="SettingsSliders"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Rules
					</SidebarNavSubmenuItemContainer.Label>
					{!isRuleCountLoading && ruleCount > 0 ? (
						<SidebarCountBadge
							count={ruleCount}
							tooltip={totalTooltip(
								ruleCount,
								'rule',
								'rules',
								isProjectPicked
							)}
							isActive={isOnRules}
							testId="issues-sidebar-rule-count"
						/>
					) : null}
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
