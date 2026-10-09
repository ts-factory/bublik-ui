/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { skipToken } from '@reduxjs/toolkit/query';
import { useEffect } from 'react';
import { useParams } from '@tanstack/react-router';

import { matchRoutePath, useRenderedLocation } from '@/router';
import { useGetSingleMeasurementQuery } from '@/services/bublik-api';
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
import {
	getModeFromSearch,
	MeasurementsSidebarMode
} from '@/bublik/features/sidebar';

import { ResultMeasurementsDialog } from './measurements-dialog';
import { useMeasurementsSidebarState } from './use-measurements-sidebar-state';

const MEASUREMENTS_SIDEBAR_MODES: readonly MeasurementsSidebarMode[] = [
	'default',
	'charts',
	'tables',
	'split',
	'overlay'
];

const MEASUREMENTS_PATH = '/runs/$runId/results/$resultId/measurements';

const MEASUREMENTS_SIDEBAR_PATTERNS = [{ to: MEASUREMENTS_PATH }];

export function MeasurementsSidebarNav() {
	const { pathname, searchStr } = useRenderedLocation();
	// The sidebar renders outside the measurements route, so it reads the
	// params of whichever page is on screen: `resultId` is there only on the
	// measurements page (which is what enables "Stacked Charts").
	const { resultId } = useParams({ strict: false });
	const { data, isLoading } = useGetSingleMeasurementQuery(
		resultId ?? skipToken
	);
	const { isAvailable, getModeUrl, mainLinkUrl, setLastVisited } =
		useMeasurementsSidebarState();

	const chartsCount = data?.charts?.length ?? 0;
	const hasStackedCharts = chartsCount >= 2;
	const isStackedLoading = isLoading && !!resultId;

	// The last result visited, stored as its pathname only (the links add the mode).
	useEffect(() => {
		if (!matchRoutePath({ to: MEASUREMENTS_PATH }, pathname)) return;

		const mode = getModeFromSearch(
			searchStr,
			MEASUREMENTS_SIDEBAR_MODES,
			'default'
		);
		setLastVisited(mode, pathname);
	}, [pathname, searchStr, setLastVisited]);

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
						to: MEASUREMENTS_PATH,
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
						to: MEASUREMENTS_PATH,
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
						to: MEASUREMENTS_PATH,
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
						to: MEASUREMENTS_PATH,
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
