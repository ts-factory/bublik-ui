/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath } from '@/router';

import { Icon } from '@/shared/tailwind-ui';
import {
	LinkWithProject,
	useNavigateWithProject
} from '@/bublik/features/projects';
import {
	getModeFromSearch,
	type LogSidebarMode
} from '@/bublik/features/sidebar';
import {
	OpenIssueCountBadge,
	SidebarKeyBadge,
	runKeyTooltip
} from '@/bublik/features/result-classification';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarNavCollapsibleContainer,
	SidebarNavInfoButton,
	SidebarNavSubmenuItemContainer,
	type SidebarNavSubmenuModeSwitchItem
} from '@/bublik/features/sidebar-nav';
import { LOG_MODES, useRunSidebarState } from './use-run-sidebar-state';

import {
	RunDetailsDialog,
	RunReportDialog,
	RunIssuesDialog,
	RunMainDialog
} from './run-dialogs';

/** Just left of the run's number, centered on it, taking no room of its own. */
const INFO_BUTTON_PLACEMENT =
	'absolute right-full top-1/2 mr-0.5 -translate-y-1/2';

const RUN_SIDEBAR_PATTERNS = [
	{ path: '/runs/:runId' },
	{ path: '/runs/:runId/report' },
	{ path: '/runs/:runId/issues' },
	{ path: '/log/:runId' }
];

const LOG_MODE_ITEMS: ReadonlyArray<
	SidebarNavSubmenuModeSwitchItem<LogSidebarMode>
> = [
	{
		value: 'treeAndinfoAndlog',
		icon: 'LayoutLogHeaderSidebar',
		label: 'Tree + info + log'
	},
	{ value: 'treeAndlog', icon: 'LayoutLogSidebar', label: 'Tree + log' },
	{ value: 'infoAndlog', icon: 'LayoutLogHeader', label: 'Info + log' },
	{ value: 'log', icon: 'LayoutLogSingle', label: 'Log' }
];

function runOpenIssuesTooltip(openCount: number, totalCount: number): string {
	const base = `${openCount} open ${
		openCount === 1 ? 'issue classifies' : 'issues classify'
	} results of this run`;

	return totalCount > openCount ? `${base}, of ${totalCount} in all` : base;
}

export function RunSidebarNav() {
	const location = useLocation();
	const navigate = useNavigateWithProject();
	const {
		isDetailsAvailable,
		isReportAvailable,
		isIssuesAvailable,
		isLogAvailable,
		isMainLinkAvailable,
		detailsUrl,
		reportUrl,
		issuesUrl,
		logUrl,
		getLogModeUrl,
		mainLinkUrl,
		activeRunId,
		activeRunName,
		isReportLoading,
		isIssuesLoading,
		issueCount,
		openIssueCount,
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

	// A bare log URL is the log-only layout, so that icon lights on it.
	const activeLogMode = matchPath('/log/:runId', location.pathname)
		? getModeFromSearch(location.search, LOG_MODES, 'log')
		: null;

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
						{/*
						 * The help button sits inside the link, ahead of the run's
						 * number: the badge keeps the edge by the chevron, and the `?`
						 * fades in just left of it, out of the flow. In the flow it would
						 * hold its width while hidden, and once the sidebar grows a
						 * scrollbar that width is what the number needs.
						 */}
						<span className="relative ml-auto flex min-w-0 items-center">
							<SidebarNavInfoButton
								disabled={!isMainLinkAvailable}
								className={INFO_BUTTON_PLACEMENT}
							>
								<RunMainDialog />
							</SidebarNavInfoButton>
							{activeRunId ? (
								<SidebarKeyBadge
									label={`#${activeRunId}`}
									tooltip={runKeyTooltip(activeRunId, activeRunName)}
									testId="run-sidebar-key"
								/>
							) : null}
						</span>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
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
					to={logUrl}
					pattern={{ path: '/log/:runId' }}
					disabled={!isLogAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="PaperText" />
					<SidebarNavSubmenuItemContainer.Label>
						Log
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.ModeSwitch
						aria-label="Log layout"
						items={LOG_MODE_ITEMS}
						value={activeLogMode}
						onSelect={(mode) => navigate(getLogModeUrl(mode))}
						testId="run-sidebar-log-mode"
					/>
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
									matchPath('/runs/:runId/issues', location.pathname) !== null
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
