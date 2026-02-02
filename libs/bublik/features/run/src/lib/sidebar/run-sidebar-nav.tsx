/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useState } from 'react';
import { useLocation, matchPath, useParams } from 'react-router-dom';

import { Dialog, DialogPortal, Icon, ModalContent } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import { RunPageParams } from '@/shared/types';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarAccordionLink,
	SidebarNavCollapsibleContainer,
	SidebarNavInfoButton
} from '@/bublik/features/sidebar-nav';
import { useRunSidebarState } from './use-run-sidebar-state';

import { RunDetailsDialog, RunReportDialog, RunMainDialog } from './run-dialogs';

function useIsActive(patterns: { path: string }[]) {
	const location = useLocation();
	return patterns.some((p) => matchPath(p.path, location.pathname));
}

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

	const isActive = useIsActive([
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

	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const pathMatch = pattern ? matchPath(pattern.path, location.pathname) : null;
	const isActive = !!pathMatch;

	const shouldShowDialog = disabled;

	const handleClick = (e: React.MouseEvent) => {
		if (shouldShowDialog) {
			e.preventDefault();
			setIsDialogOpen(true);
		}
	};

	return (
		<>
			<SidebarAccordionLink
				label={label}
				icon={icon}
				to={to}
				isActive={isActive}
				disabled={disabled}
				linkComponent={LinkWithProject}
				onClick={handleClick}
				dialogContent={dialogContent}
				onDialogOpen={
					disabled && dialogContent ? () => setIsDialogOpen(true) : undefined
				}
			/>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogPortal>
					<ModalContent>
						{dialogContent || (
							<div className="bg-white p-6 rounded-lg">
								<h2 className="text-lg font-semibold mb-4">Not Available</h2>
								<p>This section is not available yet.</p>
							</div>
						)}
					</ModalContent>
				</DialogPortal>
			</Dialog>
		</>
	);
}
