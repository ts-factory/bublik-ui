/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';

import { matchRoutePath, useRenderedLocation } from '@/router';

import { LinkWithProject } from '@/bublik/features/projects';
import { addModeToUrl, getBaseUrl } from '@/bublik/features/sidebar';
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
import { Icon } from '@/shared/tailwind-ui';

const HISTORY_SIDEBAR_PATTERNS = [{ to: '/history' }];

/** The canonical history route; the `/history/v2` alias is not recorded. */
const HISTORY_ROUTE = { to: '/history' };

export function HistorySidebarNav() {
	const { pathname, searchStr } = useRenderedLocation();
	const {
		hasTrendData,
		hasSeriesData,
		isStackedAvailable,
		isTrendLoading,
		isSeriesLoading,
		lastTrendUrl,
		lastSeriesUrl,
		lastStackedUrl,
		trendUrl,
		seriesUrl,
		mainLinkUrl,
		setLastVisited
	} = useHistorySidebarState();

	// The history page on screen is remembered per mode, as its own URL.
	useEffect(() => {
		if (!matchRoutePath(HISTORY_ROUTE, pathname)) return;

		const url = pathname + searchStr;
		const mode = new URLSearchParams(searchStr).get('mode');

		if (mode === 'linear') {
			setLastVisited('linear', url);
		} else if (mode === 'aggregation') {
			setLastVisited('aggregation', url);
		} else if (mode === 'measurements') {
			setLastVisited('trend', url);
		} else if (mode === 'measurements-by-iteration') {
			setLastVisited('series', url);
		} else if (mode === 'measurements-combined') {
			setLastVisited('stacked', url);
		}
	}, [pathname, searchStr, setLastVisited]);

	const historyBaseUrl = getBaseUrl(mainLinkUrl);
	const finalLinearUrl = addModeToUrl(historyBaseUrl, 'linear');
	const finalAggregationUrl = addModeToUrl(historyBaseUrl, 'aggregation');
	const finalStackedUrl =
		lastStackedUrl || addModeToUrl(historyBaseUrl, 'measurements-combined');

	const hasTrendUrl = hasTrendData || !!lastTrendUrl;
	const hasSeriesUrl = hasSeriesData || !!lastSeriesUrl;
	const hasStackedUrl = isStackedAvailable || !!lastStackedUrl;

	return (
		<SidebarNavCollapsibleContainer patterns={HISTORY_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="History">
					<SidebarNavInternalLink
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
					>
						<SidebarNavInternalLink.Icon name="TimeCircle" />
						<SidebarNavInternalLink.Label>History</SidebarNavInternalLink.Label>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={finalLinearUrl}
					pattern={{
						to: '/history',
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
					to={finalAggregationUrl}
					pattern={{ to: '/history', mode: 'aggregation' }}
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
					to={trendUrl}
					pattern={{ to: '/history', mode: 'measurements' }}
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
					to={seriesUrl}
					pattern={{ to: '/history', mode: 'measurements-by-iteration' }}
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
					pattern={{ to: '/history', mode: 'measurements-combined' }}
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
