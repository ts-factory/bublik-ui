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
	SidebarNavSubmenuItemContainer
} from '@/bublik/features/sidebar-nav';
import { useHistorySidebarState } from './use-history-sidebar-state';

import {
	HistoryHelpDialog,
	HistoryHelpTrendChartsDialog,
	HistoryHelpMeasurementSeriesDialog,
	HistoryHelpStackedChartsDialog
} from './history-dialogs';

const HISTORY_SIDEBAR_PATTERNS = [{ path: '/history' }];

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

	const finalTrendUrl =
		trendUrl || lastTrendUrl || '/history?mode=measurements';
	const finalSeriesUrl =
		seriesUrl || lastSeriesUrl || '/history?mode=measurements-by-iteration';
	const finalStackedUrl = stackedUrl || '/history?mode=measurements-combined';

	const hasTrendUrl = hasTrendData || !!lastTrendUrl;
	const hasSeriesUrl = hasSeriesData || !!lastSeriesUrl;
	const hasStackedUrl = isStackedAvailable;

	return (
		<SidebarNavCollapsibleContainer patterns={HISTORY_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="History">
					<SidebarNavInternalLink
						label="History"
						icon={<Icon name="TimeCircle" />}
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					label="List Of Results"
					to={linearUrl}
					icon={<Icon name="PaperListText" size={24} />}
					pattern={{ path: '/history', mode: 'linear', emptyModeMatches: ['linear'] }}
					dialogContent={<HistoryHelpDialog />}
					linkComponent={LinkWithProject}
				/>
				<SidebarNavSubmenuItemContainer
					label="Groups Of Results"
					to={aggregationUrl}
					icon={<Icon name="Aggregation" />}
					pattern={{ path: '/history', mode: 'aggregation' }}
					dialogContent={<HistoryHelpDialog />}
					linkComponent={LinkWithProject}
				/>
				<SidebarNavSubmenuItemContainer
					label="Trend Charts"
					to={finalTrendUrl}
					icon={<Icon name="LineChartSingle" />}
					pattern={{ path: '/history', mode: 'measurements' }}
					disabled={!hasTrendUrl}
					dialogContent={<HistoryHelpTrendChartsDialog />}
					linkComponent={LinkWithProject}
				/>
				<SidebarNavSubmenuItemContainer
					label="Series Charts"
					to={finalSeriesUrl}
					icon={<Icon name="LineChartSingle" />}
					pattern={{ path: '/history', mode: 'measurements-by-iteration' }}
					disabled={!hasSeriesUrl}
					dialogContent={<HistoryHelpMeasurementSeriesDialog />}
					linkComponent={LinkWithProject}
				/>
				<SidebarNavSubmenuItemContainer
					label="Stacked Charts"
					to={finalStackedUrl}
					icon={<Icon name="LineChartMultiple" />}
					pattern={{ path: '/history', mode: 'measurements-combined' }}
					disabled={!hasStackedUrl}
					dialogContent={<HistoryHelpStackedChartsDialog />}
					linkComponent={LinkWithProject}
				/>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
