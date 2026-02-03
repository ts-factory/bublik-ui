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
	SidebarNavSubmenuItem,
	getSubmenuIsActive
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
				<SubmenuItem
					label="List"
					to={listUrl}
					icon={<Icon name="PaperListText" size={24} />}
					pattern={{ path: '/runs', mode: null }}
					dialogContent={<RunsDialog />}
				/>
				<SubmenuItem
					label="Charts"
					to={chartsUrl}
					icon={<Icon name="LineChartMultiple" />}
					pattern={{ path: '/runs', mode: 'charts' }}
					dialogContent={<RunsChartsDialog />}
				/>
				<SubmenuItem
					label="Multiple"
					to={finalMultipleUrl}
					icon={<Icon name="PaperStack" className="w-6 h-6" />}
					disabled={!hasMultipleUrl}
					dialogContent={<MultipleRunsDialog />}
					pattern={{ path: '/multiple' }}
				/>
				<SubmenuItem
					label="Compare"
					to={finalCompareUrl}
					icon={<Icon name="SwapArrows" className="rotate-90" />}
					disabled={!hasCompareUrl}
					dialogContent={<CompareRunsDialog />}
					pattern={{ path: '/compare' }}
				/>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}

interface SubmenuItemProps {
	label: string;
	to: string;
	icon: React.ReactNode;
	disabled?: boolean;
	dialogContent?: React.ReactNode;
	pattern?: { path: string; mode?: string | null };
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

	const isActive = pattern
		? getSubmenuIsActive(location, {
				path: pattern.path,
				mode: pattern.mode,
				emptyModeMatches: ['table']
		  })
		: true;

	return (
		<SidebarNavSubmenuItem
			label={label}
			icon={icon}
			to={to}
			isActive={isActive}
			disabled={disabled}
			linkComponent={LinkWithProject}
			dialogContent={dialogContent}
			openDialogOnDisabled={false}
		/>
	);
}
