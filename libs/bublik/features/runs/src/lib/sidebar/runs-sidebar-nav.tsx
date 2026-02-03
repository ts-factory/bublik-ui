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
	SidebarNavSubmenuItemContainer,
	SidebarNavInfoButton
} from '@/bublik/features/sidebar-nav';

import { useRunsSidebarState } from './use-runs-sidebar-state';

import {
	RunsDialog,
	RunsChartsDialog,
	MultipleRunsDialog,
	CompareRunsDialog
} from './runs-dialogs';

const RUNS_SIDEBAR_PATTERNS = [
	{ path: '/runs' },
	{ path: '/compare' },
	{ path: '/multiple' }
];

export function RunsSidebarNav() {
	const location = useLocation();
	const {
		isCompareAvailable,
		isMultipleAvailable,
		lastCompareUrl,
		lastMultipleUrl,
		mainLinkUrl,
		listUrl,
		chartsUrl,
		compareUrl,
		multipleUrl,
		setLastVisited
	} = useRunsSidebarState();

	useEffect(() => {
		const isRunsPage = matchPath('/runs', location.pathname);
		const isMultiplePage = matchPath('/multiple', location.pathname);
		const isComparePage = matchPath('/compare', location.pathname);

		if (isRunsPage) {
			const searchParams = new URLSearchParams(location.search);
			const mode = searchParams.get('mode');

			if (mode === 'charts') {
				setLastVisited('charts', location.pathname + location.search);
				return;
			} else {
				setLastVisited('list', location.pathname + location.search);
				return;
			}
		}

		if (isComparePage) {
			setLastVisited('compare', location.pathname + location.search);
			return;
		}

		if (isMultiplePage) {
			setLastVisited('multiple', location.pathname + location.search);
			return;
		}
	}, [location.pathname, location.search, setLastVisited]);

	const finalCompareUrl = compareUrl || lastCompareUrl || '/compare';
	const finalMultipleUrl = multipleUrl || lastMultipleUrl || '/multiple';

	const hasCompareUrl = isCompareAvailable || !!lastCompareUrl;
	const hasMultipleUrl = isMultipleAvailable || !!lastMultipleUrl;

	return (
		<SidebarNavCollapsibleContainer patterns={RUNS_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Runs">
					<SidebarNavInternalLink
						label="Runs"
						icon={<Icon name="Play" />}
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={listUrl}
					pattern={{ path: '/runs', mode: null, emptyModeMatches: ['table'] }}
					linkComponent={LinkWithProject}
				>
					<Icon name="PaperListText" size={24} />
					<SidebarNavSubmenuItemContainer.Label>List</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavInfoButton>
						<RunsDialog />
					</SidebarNavInfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={chartsUrl}
					pattern={{ path: '/runs', mode: 'charts' }}
					linkComponent={LinkWithProject}
				>
					<Icon name="LineChartMultiple" />
					<SidebarNavSubmenuItemContainer.Label>Charts</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavInfoButton>
						<RunsChartsDialog />
					</SidebarNavInfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalMultipleUrl}
					disabled={!hasMultipleUrl}
					pattern={{ path: '/multiple' }}
					linkComponent={LinkWithProject}
				>
					<Icon name="PaperStack" className="w-6 h-6" />
					<SidebarNavSubmenuItemContainer.Label>Multiple</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavInfoButton disabled={!hasMultipleUrl}>
						<MultipleRunsDialog />
					</SidebarNavInfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalCompareUrl}
					disabled={!hasCompareUrl}
					pattern={{ path: '/compare' }}
					linkComponent={LinkWithProject}
				>
					<Icon name="SwapArrows" className="rotate-90" />
					<SidebarNavSubmenuItemContainer.Label>Compare</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavInfoButton disabled={!hasCompareUrl}>
						<CompareRunsDialog />
					</SidebarNavInfoButton>
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
