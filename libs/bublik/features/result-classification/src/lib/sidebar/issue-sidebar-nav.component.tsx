/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useEffect } from 'react';
import { isIdSegment, matchRoutePath, useRenderedLocation } from '@/router';

import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavCollapsibleContainer,
	SidebarNavInternalLink,
	SidebarNavLinkWrapper,
	SidebarNavSubmenuItemContainer,
	SidebarNavToggle,
	type ActivePattern
} from '@/bublik/features/sidebar-nav';

import { useIssueSidebarState } from './issue-sidebar.hooks';
import { IssueKeyBadge } from './issue-key-badge.component';
import { SidebarCountBadge } from './sidebar-count-badge.component';

function countTooltip(count: number, singular: string, plural: string) {
	return `${count} ${count === 1 ? singular : plural}`;
}

const RESULTS_PATTERN = { to: '/issues/$issueId/results' };
const RULES_PATTERN = { to: '/issues/$issueId' };

const ISSUE_PATTERNS: ActivePattern[] = [RESULTS_PATTERN, RULES_PATTERN];

// `/issues/rules` matches `/issues/$issueId` too; the id check below keeps
// the Issue entry quiet there, and these stand in for its patterns. A submenu
// item with no pattern at all counts as active, hence a path nothing routes to.
const NO_PATTERNS: ActivePattern[] = [];
const NEVER_ACTIVE_PATTERN = { to: '/__none__' };

export function IssueSidebarNav() {
	const { pathname, searchStr } = useRenderedLocation();
	const {
		mainLinkUrl,
		rulesUrl,
		resultsUrl,
		isAvailable,
		isResultsAvailable,
		isResultsLoading,
		ruleCount,
		resultCount,
		bugKey,
		issueTitle,
		isIssueClosed,
		setLastVisited
	} = useIssueSidebarState();

	const resultsMatch = matchRoutePath(RESULTS_PATTERN, pathname);
	const match = resultsMatch || matchRoutePath(RULES_PATTERN, pathname);
	const issueId = match ? match['issueId'] : undefined;
	const isIssueDetail = issueId !== undefined && isIdSegment(issueId);
	// A boolean, not the match object: that is new on every render.
	const isResultsPage = resultsMatch !== false;

	useEffect(() => {
		if (!isIssueDetail) return;

		setLastVisited(isResultsPage ? 'results' : 'rules', pathname + searchStr);
	}, [isIssueDetail, isResultsPage, pathname, searchStr, setLastVisited]);

	const patterns = isIssueDetail ? ISSUE_PATTERNS : NO_PATTERNS;

	return (
		<SidebarNavCollapsibleContainer patterns={patterns}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Issue">
					<SidebarNavInternalLink
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
						disabled={!isAvailable}
					>
						<SidebarNavInternalLink.Icon name="Paper" />
						<SidebarNavInternalLink.Label>Issue</SidebarNavInternalLink.Label>
						<IssueKeyBadge
							bugKey={bugKey}
							title={issueTitle}
							closed={isIssueClosed}
						/>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={resultsUrl}
					pattern={isIssueDetail ? RESULTS_PATTERN : NEVER_ACTIVE_PATTERN}
					disabled={!isResultsAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="Paper"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Results
					</SidebarNavSubmenuItemContainer.Label>
					{isResultsLoading ? (
						<Icon
							name="InformationCircleProgress"
							className="ml-auto size-5 animate-spin text-primary"
						/>
					) : resultCount > 0 ? (
						<SidebarCountBadge
							count={resultCount}
							tooltip={countTooltip(
								resultCount,
								'result stamped under this issue, across every run',
								'results stamped under this issue, across every run'
							)}
							isActive={isIssueDetail && isResultsPage}
							testId="issue-sidebar-result-count"
						/>
					) : null}
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={rulesUrl}
					pattern={isIssueDetail ? RULES_PATTERN : NEVER_ACTIVE_PATTERN}
					disabled={!isAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="SettingsSliders"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Rules
					</SidebarNavSubmenuItemContainer.Label>
					{ruleCount > 0 ? (
						<SidebarCountBadge
							count={ruleCount}
							tooltip={countTooltip(ruleCount, 'rule', 'rules')}
							isActive={isIssueDetail && !isResultsPage}
							testId="issue-sidebar-rule-count"
						/>
					) : null}
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
