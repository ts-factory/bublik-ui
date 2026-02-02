/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

import { Dialog, DialogPortal, Icon, ModalContent } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarAccordionLink,
	SidebarNavCollapsibleContainer
} from '@/bublik/features/sidebar-nav';
import { useHistorySidebarState } from './use-history-sidebar-state';

import {
	HistoryHelpDialog,
	HistoryHelpTrendChartsDialog,
	HistoryHelpMeasurementSeriesDialog,
	HistoryHelpStackedChartsDialog
} from './history-dialogs';

function useIsActive(patterns: { path: string }[]) {
	const location = useLocation();
	return patterns.some((p) => matchPath(p.path, location.pathname));
}

export function HistorySidebarNav() {
	const location = useLocation();
	const {
		hasTrendData,
		hasSeriesData,
		isStackedAvailable,
		lastTrendUrl,
		lastSeriesUrl,
		linearUrl,
		aggregationUrl,
		trendUrl,
		seriesUrl,
		stackedUrl,
		mainLinkUrl,
		setLastVisited
	} = useHistorySidebarState();

	const isActive = useIsActive([{ path: '/history' }]);

	useEffect(() => {
		if (location.pathname === '/history') {
			const searchParams = new URLSearchParams(location.search);
			const mode = searchParams.get('mode');

			if (mode === 'linear') {
				setLastVisited('linear', location.pathname + location.search);
			} else if (mode === 'aggregation') {
				setLastVisited('aggregation', location.pathname + location.search);
			} else if (mode === 'measurements') {
				setLastVisited('trend', location.pathname + location.search);
			} else if (mode === 'measurements-by-iteration') {
				setLastVisited('series', location.pathname + location.search);
			} else if (mode === 'measurements-combined') {
				setLastVisited('stacked', location.pathname + location.search);
			}
		}
	}, [location.pathname, location.search, setLastVisited]);

	const finalTrendUrl = trendUrl || lastTrendUrl || '/history?mode=measurements';
	const finalSeriesUrl =
		seriesUrl || lastSeriesUrl || '/history?mode=measurements-by-iteration';
	const finalStackedUrl = stackedUrl || '/history?mode=measurements-combined';

	const hasTrendUrl = hasTrendData || !!lastTrendUrl;
	const hasSeriesUrl = hasSeriesData || !!lastSeriesUrl;
	const hasStackedUrl = isStackedAvailable;

	return (
		<SidebarNavCollapsibleContainer isActive={isActive}>
			<SidebarNavCollapsibleContainer.Item isActive={isActive}>
				<SidebarNavLinkWrapper label="History">
					<SidebarNavInternalLink
						label="History"
						icon={<Icon name="TimeCircle" />}
						to={mainLinkUrl}
						isActive={isActive}
						linkComponent={LinkWithProject}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle isActive={isActive} />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SubmenuItem
					label="List Of Results"
					to={linearUrl}
					icon={<Icon name="PaperListText" size={24} />}
					pattern={{ path: '/history', mode: 'linear' }}
					dialogContent={<HistoryHelpDialog />}
				/>
				<SubmenuItem
					label="Groups Of Results"
					to={aggregationUrl}
					icon={<Icon name="Aggregation" />}
					pattern={{ path: '/history', mode: 'aggregation' }}
					dialogContent={<HistoryHelpDialog />}
				/>
				<SubmenuItem
					label="Trend Charts"
					to={finalTrendUrl}
					icon={<Icon name="LineChartSingle" />}
					pattern={{ path: '/history', mode: 'measurements' }}
					disabled={!hasTrendUrl}
					dialogContent={<HistoryHelpTrendChartsDialog />}
				/>
				<SubmenuItem
					label="Series Charts"
					to={finalSeriesUrl}
					icon={<Icon name="LineChartSingle" />}
					pattern={{ path: '/history', mode: 'measurements-by-iteration' }}
					disabled={!hasSeriesUrl}
					dialogContent={<HistoryHelpMeasurementSeriesDialog />}
				/>
				<SubmenuItem
					label="Stacked Charts"
					to={finalStackedUrl}
					icon={<Icon name="LineChartMultiple" />}
					pattern={{ path: '/history', mode: 'measurements-combined' }}
					disabled={!hasStackedUrl}
					dialogContent={<HistoryHelpStackedChartsDialog />}
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
	pattern?: { path: string; mode?: string | null };
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

	const searchParams = new URLSearchParams(location.search);
	const currentMode = searchParams.get('mode');
	const modeMatch =
		pattern?.mode !== undefined
			? pattern.mode === null
				? !currentMode || currentMode === 'linear'
				: currentMode === pattern.mode
			: true;

	const isActive = !!pathMatch && modeMatch;

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
