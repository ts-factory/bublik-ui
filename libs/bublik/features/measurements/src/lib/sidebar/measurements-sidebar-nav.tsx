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
import { useMeasurementsSidebarState } from './use-measurements-sidebar-state';

import { ResultMeasurementsDialog } from './measurements-dialog';

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
	const { isAvailable, getModeUrl, mainLinkUrl, setLastVisited } =
		useMeasurementsSidebarState();

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
						label="Result"
						icon={<Icon name="LineGraph" />}
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
						disabled={!isAvailable}
					/>
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
					<Icon name="LineChart" />
					<SidebarNavSubmenuItemContainer.Label>Charts + Tables</SidebarNavSubmenuItemContainer.Label>
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
					<Icon name="LayoutSidebarHeader" />
					<SidebarNavSubmenuItemContainer.Label>Charts || Tables</SidebarNavSubmenuItemContainer.Label>
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
					<Icon name="PaperListText" />
					<SidebarNavSubmenuItemContainer.Label>Measurement Tables</SidebarNavSubmenuItemContainer.Label>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={getModeUrl('overlay')}
					pattern={{
						path: '/runs/:runId/results/:resultId/measurements',
						mode: 'overlay'
					}}
					disabled={!isAvailable}
					linkComponent={LinkWithProject}
				>
					<Icon name="LineChartMultiple" />
					<SidebarNavSubmenuItemContainer.Label>Stacked Charts</SidebarNavSubmenuItemContainer.Label>
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
