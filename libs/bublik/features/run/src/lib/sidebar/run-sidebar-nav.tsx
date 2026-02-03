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
	SidebarNavSubmenuItem,
	useIsActivePaths
} from '@/bublik/features/sidebar-nav';
import { useRunSidebarState } from './use-run-sidebar-state';

import {
	RunDetailsDialog,
	RunReportDialog,
	RunMainDialog
} from './run-dialogs';

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
		setLastVisited
	} = useRunSidebarState();

	const isActive = useIsActivePaths([
		{ path: '/runs/:runId' },
		{ path: '/runs/:runId/report' }
	]);

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
		<SidebarNavCollapsibleContainer isActive={isActive}>
			<SidebarNavCollapsibleContainer.Item isActive={isActive}>
				<SidebarNavLinkWrapper label="Run">
					<SidebarNavInternalLink
						label="Run"
						icon={<Icon name="PieChart" />}
						to={mainLinkUrl}
						isActive={isActive}
						linkComponent={LinkWithProject}
						disabled={!isMainLinkAvailable}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavInfoButton disabled={!isMainLinkAvailable}>
					<RunMainDialog />
				</SidebarNavInfoButton>
				<SidebarNavToggle isActive={isActive} />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SubmenuItem
					label="Details"
					to={finalDetailsUrl}
					icon={<Icon name="Paper" className="w-6 h-6" />}
					pattern={{ path: '/runs/:runId' }}
					dialogContent={<RunDetailsDialog />}
					disabled={!isDetailsAvailable}
				/>
				<SubmenuItem
					label="Report"
					to={finalReportUrl}
					icon={<Icon name="LineChart" />}
					pattern={{ path: '/runs/:runId/report' }}
					dialogContent={<RunReportDialog />}
					disabled={!isReportAvailable}
				/>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}

interface SubmenuItemProps {
	label: string;
	to: string;
	icon: React.ReactNode;
	disabled?: boolean;
	dialogContent?: React.ReactNode;
	pattern?: { path: string };
}

function SubmenuItem({
	label,
	to,
	icon,
	disabled,
	dialogContent,
	pattern
}: SubmenuItemProps) {
	const location = useLocation();

	const pathMatch = pattern ? matchPath(pattern.path, location.pathname) : null;
	const isActive = !!pathMatch;

	return (
		<SidebarNavSubmenuItem
			label={label}
			icon={icon}
			to={to}
			isActive={isActive}
			disabled={disabled}
			linkComponent={LinkWithProject}
			dialogContent={dialogContent}
		/>
	);
}
