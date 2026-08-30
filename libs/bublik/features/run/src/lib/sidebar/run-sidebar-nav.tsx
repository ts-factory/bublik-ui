/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
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

const RUN_SIDEBAR_PATTERNS = [
	{ path: '/runs/:runId' },
	{ path: '/runs/:runId/report' },
	{ path: '/runs/:runId/issues' }
];

export function RunSidebarNav() {
	const location = useLocation();
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
		setLastVisited
	} = useRunSidebarState();

	/**
	 * The run id comes from `matchPath`, not `useParams`: the sidebar renders in
	 * the pathless layout route, above the `Outlet`, so `useParams` there only
	 * ever sees the layout's own (empty) params and this effect never ran.
	 *
	 * `/runs/:runId/report` is deliberately absent -- the report page records
	 * itself once it has a config id, and two writers in one commit clobber
	 * each other's `_s`.
	 */
	useEffect(() => {
		const issuesMatch = matchPath('/runs/:runId/issues', location.pathname);
		const match = issuesMatch ?? matchPath('/runs/:runId', location.pathname);
		const matchedRunId = match?.params.runId;

		if (!matchedRunId || !/^\d+$/.test(matchedRunId)) return;

		setLastVisited(
			issuesMatch ? 'issues' : 'details',
			location.pathname + location.search,
			matchedRunId
		);
	}, [location.pathname, location.search, setLastVisited]);

	return (
		<SidebarNavCollapsibleContainer patterns={RUN_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Run">
					<SidebarNavInternalLink
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
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
					pattern={{ path: '/runs/:runId' }}
					disabled={!isDetailsAvailable}
					linkComponent={LinkWithProject}
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
					to={reportUrl ?? '/runs'}
					pattern={{ path: '/runs/:runId/report' }}
					disabled={!isReportAvailable}
					linkComponent={LinkWithProject}
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
					pattern={{ path: '/runs/:runId/issues' }}
					disabled={!isIssuesAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="TriangleExclamationMark"
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
						<span
							className="ml-auto rounded bg-badge-0 px-1.5 text-[0.6875rem] font-medium leading-[1.125rem] tabular-nums text-text-primary"
							data-testid="run-sidebar-issue-count"
						>
							{issueCount}
						</span>
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
