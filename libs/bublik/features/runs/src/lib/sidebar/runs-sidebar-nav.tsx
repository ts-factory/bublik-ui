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
	SidebarNavSubmenuItemContainer
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
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
					>
						<SidebarNavInternalLink.Icon name="Play" />
						<SidebarNavInternalLink.Label>Runs</SidebarNavInternalLink.Label>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={listUrl}
					pattern={{ path: '/runs', mode: null, emptyModeMatches: ['table'] }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="PaperListText"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						List
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<RunsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={chartsUrl}
					pattern={{ path: '/runs', mode: 'charts' }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="LineChartMultiple"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Charts
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<RunsChartsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalMultipleUrl}
					disabled={!hasMultipleUrl}
					pattern={{ path: '/multiple' }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="PaperStack"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Multiple
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<MultipleRunsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalCompareUrl}
					disabled={!hasCompareUrl}
					pattern={{ path: '/compare' }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="SwapArrows"
						className="rotate-90"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Compare
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<CompareRunsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
