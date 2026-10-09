/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';

import { matchRoutePath, useRenderedLocation } from '@/router';

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
	{ to: '/runs' },
	{ to: '/compare' },
	{ to: '/multiple' }
];

export function RunsSidebarNav() {
	const { pathname, searchStr } = useRenderedLocation();
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
		const isRunsPage = matchRoutePath({ to: '/runs' }, pathname);
		const isMultiplePage = matchRoutePath({ to: '/multiple' }, pathname);
		const isComparePage = matchRoutePath({ to: '/compare' }, pathname);
		const url = pathname + searchStr;

		if (isRunsPage) {
			const mode = new URLSearchParams(searchStr).get('mode');

			if (mode === 'charts') {
				setLastVisited('charts', url);
				return;
			} else if (mode === 'progress') {
				setLastVisited('progress', url);
				return;
			} else {
				setLastVisited('list', url);
				return;
			}
		}

		if (isComparePage) {
			setLastVisited('compare', url);
			return;
		}

		if (isMultiplePage) {
			setLastVisited('multiple', url);
			return;
		}
	}, [pathname, searchStr, setLastVisited]);

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
					pattern={{ to: '/runs', mode: null, emptyModeMatches: ['table'] }}
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
					pattern={{ to: '/runs', mode: 'charts' }}
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
					to={progressUrl}
					pattern={{ to: '/runs', mode: 'progress' }}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon
						name="Aggregation"
						className="size-6"
					/>
					<SidebarNavSubmenuItemContainer.Label>
						Table
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<RunsDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={finalMultipleUrl}
					disabled={!isMultipleAvailable}
					pattern={{ to: '/multiple' }}
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
					disabled={!isCompareAvailable}
					pattern={{ to: '/compare' }}
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
