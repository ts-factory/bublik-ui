/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

import { docsUrl, USER_GUIDE } from '@/bublik/config';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarNavCollapsibleContainer,
	SidebarNavSubmenuItemContainer
} from '@/bublik/features/sidebar-nav';

import { useRunsSidebarState } from './use-runs-sidebar-state';

const RUNS_SIDEBAR_PATTERNS = [
	{ path: '/runs' },
	{ path: '/compare' },
	{ path: '/multiple' }
];

export function RunsSidebarNav() {
	const location = useLocation();
	const {
		selectedRunIds,
		isCompareAvailable,
		isMultipleAvailable,
		lastCompareUrl,
		lastMultipleUrl,
		mainLinkUrl,
		listUrl,
		chartsUrl,
		progressUrl,
		compareUrl,
		multipleUrl,
		setLastVisited
	} = useRunsSidebarState();

	const hasSameSelectedRunsInLastCompareUrl = (() => {
		if (!lastCompareUrl || selectedRunIds.length !== 2) {
			return false;
		}

		const [, search = ''] = lastCompareUrl.split('?');
		const params = new URLSearchParams(search);

		return (
			params.get('left') === selectedRunIds[0] &&
			params.get('right') === selectedRunIds[1]
		);
	})();

	const hasSameSelectedRunsInLastMultipleUrl = (() => {
		if (!lastMultipleUrl || selectedRunIds.length < 2) {
			return false;
		}

		const [, search = ''] = lastMultipleUrl.split('?');
		const params = new URLSearchParams(search);
		const runIds = params.getAll('runIds');

		return (
			runIds.length === selectedRunIds.length &&
			runIds.every((runId, index) => runId === selectedRunIds[index])
		);
	})();

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
			} else if (mode === 'progress') {
				setLastVisited('progress', location.pathname + location.search);
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

	const finalCompareUrl = hasSameSelectedRunsInLastCompareUrl
		? lastCompareUrl ?? '/compare'
		: compareUrl || lastCompareUrl || '/compare';
	const finalMultipleUrl = hasSameSelectedRunsInLastMultipleUrl
		? lastMultipleUrl ?? '/multiple'
		: multipleUrl || lastMultipleUrl || '/multiple';

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
					<SidebarNavSubmenuItemContainer.InfoButton
						href={docsUrl(USER_GUIDE.runsList)}
						label="Runs list"
					/>
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
					<SidebarNavSubmenuItemContainer.InfoButton
						href={docsUrl(USER_GUIDE.runsCharts)}
						label="Runs charts"
					/>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={progressUrl}
					pattern={{ path: '/runs', mode: 'progress' }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="Aggregation"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Table
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton
						href={docsUrl(USER_GUIDE.runsTable)}
						label="Runs table"
					/>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalMultipleUrl}
					disabled={!isMultipleAvailable}
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
					<SidebarNavSubmenuItemContainer.InfoButton
						href={docsUrl(USER_GUIDE.runsMultiple)}
						label="Multiple runs"
					/>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalCompareUrl}
					disabled={!isCompareAvailable}
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
					<SidebarNavSubmenuItemContainer.InfoButton
						href={docsUrl(USER_GUIDE.runsCompare)}
						label="Compare runs"
					/>
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}
