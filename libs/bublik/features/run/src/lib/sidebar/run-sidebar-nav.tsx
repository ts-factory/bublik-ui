/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { linkOptions } from '@tanstack/react-router';

import {
	isIdSegment,
	matchRoutePath,
	useRenderedLocation,
	type RoutePathPattern
} from '@/router';

import { Icon } from '@/shared/tailwind-ui';
import { RouterLinkWithProject } from '@/bublik/features/projects';
import { OpenIssueCountBadge } from '@/bublik/features/result-classification';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarNavCollapsibleContainer,
	SidebarNavInfoButton,
	SidebarNavSubmenuItemContainer
} from '@/bublik/features/sidebar-nav';
import { useRunSidebarState } from './use-run-sidebar-state';

import {
	RunDetailsDialog,
	RunReportDialog,
	RunIssuesDialog,
	RunMainDialog
} from './run-dialogs';

/** Where the disabled report item points: the run list. */
const RUNS = linkOptions({ to: '/runs' }).to;

const RUN_SIDEBAR_PATTERNS: RoutePathPattern[] = [
	{ to: '/runs/$runId' },
	{ to: '/runs/$runId/report' },
	{ to: '/runs/$runId/issues' }
];

function runOpenIssuesTooltip(openCount: number, totalCount: number): string {
	const base = `${openCount} open ${
		openCount === 1 ? 'issue classifies' : 'issues classify'
	} results of this run`;

	return totalCount > openCount ? `${base}, of ${totalCount} in all` : base;
}

export function RunSidebarNav() {
	const { pathname, searchStr } = useRenderedLocation();
	const {
		isDetailsAvailable,
		isReportAvailable,
		isIssuesAvailable,
		isMainLinkAvailable,
		detailsUrl,
		reportUrl,
		issuesUrl,
		mainLinkUrl,
		isReportLoading,
		isIssuesLoading,
		issueCount,
		openIssueCount,
		setLastVisited
	} = useRunSidebarState();

	/**
	 * The run id comes from matching the page on screen, not `useParams`: the
	 * sidebar renders above the page's match, so `useParams` there only ever
	 * sees the layout's own (empty) params and this effect never ran.
	 *
	 * `/runs/:runId/report` is deliberately absent -- the report page records
	 * itself once it has a config id, and two writers in one commit clobber
	 * each other's `_s`.
	 */
	useEffect(() => {
		const issuesMatch = matchRoutePath({ to: '/runs/$runId/issues' }, pathname);
		const match =
			issuesMatch || matchRoutePath({ to: '/runs/$runId' }, pathname);
		const matchedRunId = match ? match.runId : undefined;

		// Only an id is a run, by the rule the run routes parse it with
		if (!matchedRunId || !isIdSegment(matchedRunId)) return;

		setLastVisited(
			issuesMatch ? 'issues' : 'details',
			pathname + searchStr,
			matchedRunId
		);
	}, [pathname, searchStr, setLastVisited]);

	return (
		<SidebarNavCollapsibleContainer patterns={RUN_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Run">
					<SidebarNavInternalLink
						to={mainLinkUrl}
						linkComponent={RouterLinkWithProject}
						disabled={!isMainLinkAvailable}
					>
						<SidebarNavInternalLink.Icon name="PieChart" />
						<SidebarNavInternalLink.Label>Run</SidebarNavInternalLink.Label>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavInfoButton disabled={!isMainLinkAvailable}>
					<RunMainDialog />
				</SidebarNavInfoButton>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={detailsUrl}
					pattern={{ to: '/runs/$runId' }}
					disabled={!isDetailsAvailable}
					linkComponent={RouterLinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="Paper"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Details
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<RunDetailsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={reportUrl ?? RUNS}
					pattern={{ to: '/runs/$runId/report' }}
					disabled={!isReportAvailable}
					linkComponent={RouterLinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LineChart" />
					<SidebarNavSubmenuItemContainer.Label>
						Report
					</SidebarNavSubmenuItemContainer.Label>
					{isReportLoading ? (
						<Icon
							name="InformationCircleProgress"
							className="ml-auto size-5 animate-spin text-primary"
						/>
					) : (
						<SidebarNavSubmenuItemContainer.InfoButton>
							<RunReportDialog />
						</SidebarNavSubmenuItemContainer.InfoButton>
					)}
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={issuesUrl}
					pattern={{ to: '/runs/$runId/issues' }}
					disabled={!isIssuesAvailable}
					linkComponent={RouterLinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="IssueIcon"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Issues
					</SidebarNavSubmenuItemContainer.Label>
					{isIssuesLoading ? (
						<Icon
							name="InformationCircleProgress"
							className="ml-auto size-5 animate-spin text-primary"
						/>
					) : issueCount > 0 ? (
						// A run whose issues are all closed keeps its Issues page but
						// shows no badge: there is nothing open to count.
						openIssueCount > 0 && (
							<OpenIssueCountBadge
								count={openIssueCount}
								tooltip={runOpenIssuesTooltip(openIssueCount, issueCount)}
								isActive={
									matchRoutePath({ to: '/runs/$runId/issues' }, pathname) !==
									false
								}
								testId="run-sidebar-issue-count"
							/>
						)
					) : (
						<SidebarNavSubmenuItemContainer.InfoButton>
							<RunIssuesDialog />
						</SidebarNavSubmenuItemContainer.InfoButton>
					)}
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
