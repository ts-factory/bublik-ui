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
	RunMainDialog
} from './run-dialogs';

const RUN_SIDEBAR_PATTERNS = [
	{ path: '/runs/:runId' },
	{ path: '/runs/:runId/report' }
];

export function RunSidebarNav() {
	const location = useLocation();
	const { runId } = useParams<RunPageParams>();
	const {
		isDetailsAvailable,
		isReportAvailable,
		isMainLinkAvailable,
		lastDetailsUrl,
		lastReportUrl,
		detailsUrl,
		reportUrl,
		mainLinkUrl,
		isReportLoading,
		setLastVisited
	} = useRunSidebarState();

	useEffect(() => {
		if (matchPath('/runs/:runId/report', location.pathname) && runId) {
			setLastVisited('report', location.pathname + location.search, runId);
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
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
