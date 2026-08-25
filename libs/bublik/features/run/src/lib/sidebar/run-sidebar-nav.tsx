/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath, useParams } from 'react-router-dom';

import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { RunPageParams } from '@/shared/types';
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
	const { runId } = useParams<RunPageParams>();
	const {
		isDetailsAvailable,
		isReportAvailable,
		isIssuesAvailable,
		isMainLinkAvailable,
		lastDetailsUrl,
		lastReportUrl,
		detailsUrl,
		reportUrl,
		issuesUrl,
		mainLinkUrl,
		isReportLoading,
		isIssuesLoading,
		issueCount,
		setLastVisited
	} = useRunSidebarState();

	useEffect(() => {
		if (matchPath('/runs/:runId/report', location.pathname) && runId) {
			setLastVisited('report', location.pathname + location.search, runId);
		} else if (matchPath('/runs/:runId/issues', location.pathname) && runId) {
			setLastVisited('issues', location.pathname + location.search, runId);
		} else if (matchPath('/runs/:runId', location.pathname) && runId) {
			setLastVisited('details', location.pathname + location.search, runId);
		}
	}, [location.pathname, location.search, runId, setLastVisited]);

	const finalDetailsUrl = lastDetailsUrl || detailsUrl;
	const finalReportUrl = reportUrl || lastReportUrl || '/runs';

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
					to={finalDetailsUrl}
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
					to={finalReportUrl}
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
							className="ml-auto rounded bg-badge-0 px-1.5 text-[0.6875rem] font-medium leading-[1.125rem] tabular-nums text-text-menu"
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
