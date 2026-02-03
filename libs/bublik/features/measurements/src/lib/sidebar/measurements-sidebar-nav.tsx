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
	SidebarNavSubmenuItem,
	useIsActivePaths
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

export function MeasurementsSidebarNav() {
	const location = useLocation();
	const { isAvailable, getModeUrl, mainLinkUrl, setLastVisited } =
		useMeasurementsSidebarState();

	const isActive = useIsActivePaths([
		{ path: '/runs/:runId/results/:resultId/measurements' }
	]);

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
		<SidebarNavCollapsibleContainer isActive={isActive}>
			<SidebarNavCollapsibleContainer.Item isActive={isActive}>
				<SidebarNavLinkWrapper label="Result">
					<SidebarNavInternalLink
						label="Result"
						icon={<Icon name="LineGraph" />}
						to={mainLinkUrl}
						isActive={isActive}
						linkComponent={LinkWithProject}
						disabled={!isAvailable}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavInfoButton disabled={!isAvailable}>
					<ResultMeasurementsDialog />
				</SidebarNavInfoButton>
				<SidebarNavToggle isActive={isActive} />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SubmenuItem
					label="Charts + Tables"
					to={getModeUrl('default')}
					icon={<Icon name="LineChart" />}
					pattern={{
						path: '/runs/:runId/results/:resultId/measurements',
						mode: 'default'
					}}
					disabled={!isAvailable}
				/>
				<SubmenuItem
					label="Charts || Tables"
					to={getModeUrl('split')}
					icon={<Icon name="LayoutSidebarHeader" />}
					pattern={{
						path: '/runs/:runId/results/:resultId/measurements',
						mode: 'split'
					}}
					disabled={!isAvailable}
				/>
				<SubmenuItem
					label="Measurement Tables"
					to={getModeUrl('tables')}
					icon={<Icon name="PaperListText" />}
					pattern={{
						path: '/runs/:runId/results/:resultId/measurements',
						mode: 'tables'
					}}
					disabled={!isAvailable}
				/>
				<SubmenuItem
					label="Stacked Charts"
					to={getModeUrl('overlay')}
					icon={<Icon name="LineChartMultiple" />}
					pattern={{
						path: '/runs/:runId/results/:resultId/measurements',
						mode: 'overlay'
					}}
					disabled={!isAvailable}
				/>
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

interface SubmenuItemProps {
	label: string;
	to: string;
	icon: React.ReactNode;
	disabled?: boolean;
	dialogContent?: React.ReactNode;
	pattern?: { path: string; mode?: MeasurementsSidebarMode };
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

	const searchParams = new URLSearchParams(location.search);
	const currentMode = searchParams.get('mode') || 'default';
	const modeMatch = pattern?.mode ? currentMode === pattern.mode : true;

	const isActive = !!pathMatch && modeMatch;

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
