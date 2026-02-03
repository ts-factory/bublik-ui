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
					to={linearUrl}
					pattern={{ path: '/history', mode: 'linear', emptyModeMatches: ['linear'] }}
					linkComponent={LinkWithProject}
				>
					<Icon name="PaperListText" size={24} />
					<SidebarNavSubmenuItemContainer.Label>List Of Results</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavInfoButton>
						<HistoryHelpDialog />
					</SidebarNavInfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={aggregationUrl}
					pattern={{ path: '/history', mode: 'aggregation' }}
					linkComponent={LinkWithProject}
				>
					<Icon name="Aggregation" />
					<SidebarNavSubmenuItemContainer.Label>Groups Of Results</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavInfoButton>
						<HistoryHelpDialog />
					</SidebarNavInfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalTrendUrl}
					pattern={{ path: '/history', mode: 'measurements' }}
					disabled={!hasTrendUrl}
					linkComponent={LinkWithProject}
				>
					<Icon name="LineChartSingle" />
					<SidebarNavSubmenuItemContainer.Label>Trend Charts</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavInfoButton>
						<HistoryHelpTrendChartsDialog />
					</SidebarNavInfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalSeriesUrl}
					pattern={{ path: '/history', mode: 'measurements-by-iteration' }}
					disabled={!hasSeriesUrl}
					linkComponent={LinkWithProject}
				>
					<Icon name="LineChartSingle" />
					<SidebarNavSubmenuItemContainer.Label>Series Charts</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavInfoButton>
						<HistoryHelpMeasurementSeriesDialog />
					</SidebarNavInfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalStackedUrl}
					pattern={{ path: '/history', mode: 'measurements-combined' }}
					disabled={!hasStackedUrl}
					linkComponent={LinkWithProject}
				>
					<Icon name="LineChartMultiple" />
					<SidebarNavSubmenuItemContainer.Label>Stacked Charts</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavInfoButton>
						<HistoryHelpStackedChartsDialog />
					</SidebarNavInfoButton>
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
