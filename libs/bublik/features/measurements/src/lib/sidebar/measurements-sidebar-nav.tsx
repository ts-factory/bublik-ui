/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect } from 'react';
import { matchPath, useLocation, useParams } from 'react-router-dom';

import { useGetSingleMeasurementQuery } from '@/services/bublik-api';
import { Icon } from '@/shared/tailwind-ui';
import { MeasurementsRouterParams } from '@/shared/types';

import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarNavCollapsibleContainer,
	SidebarNavInfoButton,
	SidebarNavSubmenuItemContainer
} from '@/bublik/features/sidebar-nav';

import { ResultMeasurementsDialog } from './measurements-dialog';
import { useMeasurementsSidebarState } from './use-measurements-sidebar-state';

function getModeFromSearch(search: string): MeasurementsSidebarMode {
	const params = new URLSearchParams(search);
	const mode = params.get('mode');
	switch (mode) {
		case 'charts':
			return 'charts';
		case 'tables':
			return 'tables';
		case 'split':
			return 'split';
		case 'overlay':
			return 'overlay';
		case 'default':
		default:
			return 'default';
	}
}

const MEASUREMENTS_SIDEBAR_PATTERNS = [
	{ path: '/runs/:runId/results/:resultId/measurements' }
];

export function MeasurementsSidebarNav() {
	const location = useLocation();
	const { resultId } = useParams<MeasurementsRouterParams>();
	const { data, isLoading } = useGetSingleMeasurementQuery(
		resultId ?? skipToken
	);
	const { isAvailable, getModeUrl, mainLinkUrl, setLastVisited } =
		useMeasurementsSidebarState();

	const chartsCount = data?.charts?.length ?? 0;
	const hasStackedCharts = chartsCount >= 2;
	const isStackedLoading = isLoading && !!resultId;

	useEffect(() => {
		const pathMatch = matchPath(
			'/runs/:runId/results/:resultId/measurements',
			location.pathname
		);
		if (pathMatch) {
			const mode = getModeFromSearch(location.search);
			setLastVisited(mode, location.pathname + location.search);
		}
	}, [location.pathname, location.search, setLastVisited]);

	return (
		<SidebarNavCollapsibleContainer patterns={MEASUREMENTS_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Result">
					<SidebarNavInternalLink
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
						disabled={!isAvailable}
					>
						<SidebarNavInternalLink.Icon name="LineGraph" />
						<SidebarNavInternalLink.Label>Result</SidebarNavInternalLink.Label>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavInfoButton disabled={!isAvailable}>
					<ResultMeasurementsDialog />
				</SidebarNavInfoButton>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={getModeUrl('default')}
					pattern={{
						path: '/runs/:runId/results/:resultId/measurements',
						mode: 'default',
						defaultMode: 'default'
					}}
					disabled={!isAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LineChart" />
					<SidebarNavSubmenuItemContainer.Label>
						Charts + Tables
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<ResultMeasurementsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={getModeUrl('split')}
					pattern={{
						path: '/runs/:runId/results/:resultId/measurements',
						mode: 'split'
					}}
					disabled={!isAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LayoutSidebarHeader" />
					<SidebarNavSubmenuItemContainer.Label>
						Charts || Tables
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<ResultMeasurementsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={getModeUrl('tables')}
					pattern={{
						path: '/runs/:runId/results/:resultId/measurements',
						mode: 'tables'
					}}
					disabled={!isAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="PaperListText" />
					<SidebarNavSubmenuItemContainer.Label>
						Measurement Tables
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<ResultMeasurementsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={getModeUrl('overlay')}
					pattern={{
						path: '/runs/:runId/results/:resultId/measurements',
						mode: 'overlay'
					}}
					disabled={!isAvailable || !hasStackedCharts}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LineChartMultiple" />
					<SidebarNavSubmenuItemContainer.Label>
						Stacked Charts
					</SidebarNavSubmenuItemContainer.Label>
					{isStackedLoading ? (
						<Icon
							name="InformationCircleProgress"
							className="ml-auto size-5 animate-spin text-primary"
						/>
					) : (
						<SidebarNavSubmenuItemContainer.InfoButton>
							<ResultMeasurementsDialog />
						</SidebarNavSubmenuItemContainer.InfoButton>
					)}
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}

type MeasurementsSidebarMode =
	| 'default'
	| 'charts'
	| 'tables'
	| 'split'
	| 'overlay';
