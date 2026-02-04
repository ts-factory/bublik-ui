/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

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
import { Icon } from '@/shared/tailwind-ui';

const HISTORY_SIDEBAR_PATTERNS = [{ path: '/history' }];

export function HistorySidebarNav() {
	const location = useLocation();
	const {
		hasTrendData,
		hasSeriesData,
		isStackedAvailable,
		isTrendLoading,
		isSeriesLoading,
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
					pattern={{
						path: '/history',
						mode: 'linear',
						emptyModeMatches: ['linear']
					}}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="PaperListText" size={22} />
					<SidebarNavSubmenuItemContainer.Label>
						List Of Results
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<HistoryHelpDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={aggregationUrl}
					pattern={{ path: '/history', mode: 'aggregation' }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="Aggregation" size={22} />
					<SidebarNavSubmenuItemContainer.Label>
						Groups Of Results
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<HistoryHelpDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalTrendUrl}
					pattern={{ path: '/history', mode: 'measurements' }}
					disabled={!hasTrendUrl}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LineChartSingle" />
					<SidebarNavSubmenuItemContainer.Label>
						Trend Charts
					</SidebarNavSubmenuItemContainer.Label>
					{isTrendLoading ? (
						<Icon
							name="InformationCircleProgress"
							className="ml-auto size-5 animate-spin text-primary"
						/>
					) : (
						<SidebarNavSubmenuItemContainer.InfoButton>
							<HistoryHelpTrendChartsDialog />
						</SidebarNavSubmenuItemContainer.InfoButton>
					)}
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalSeriesUrl}
					pattern={{ path: '/history', mode: 'measurements-by-iteration' }}
					disabled={!hasSeriesUrl}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LineChartSingle" />
					<SidebarNavSubmenuItemContainer.Label>
						Series Charts
					</SidebarNavSubmenuItemContainer.Label>
					{isSeriesLoading ? (
						<Icon
							name="InformationCircleProgress"
							className="ml-auto size-5 animate-spin text-primary"
						/>
					) : (
						<SidebarNavSubmenuItemContainer.InfoButton>
							<HistoryHelpMeasurementSeriesDialog />
						</SidebarNavSubmenuItemContainer.InfoButton>
					)}
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalStackedUrl}
					pattern={{ path: '/history', mode: 'measurements-combined' }}
					disabled={!hasStackedUrl}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LineChartMultiple" />
					<SidebarNavSubmenuItemContainer.Label>
						Stacked Charts
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<HistoryHelpStackedChartsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
