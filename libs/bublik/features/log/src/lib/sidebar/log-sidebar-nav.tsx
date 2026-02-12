/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath, useParams } from 'react-router-dom';

import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarNavCollapsibleContainer,
	SidebarNavInfoButton,
	SidebarNavSubmenuItemContainer
} from '@/bublik/features/sidebar-nav';
import { LogPageParams } from '@/shared/types';
import { useLogSidebarState } from './use-log-sidebar-state';

import { LogDialog } from './log-dialog';

function getModeFromSearch(search: string): LogSidebarMode {
	const params = new URLSearchParams(search);
	const mode = params.get('mode');
	switch (mode) {
		case 'infoAndlog':
			return 'infoAndlog';
		case 'treeAndlog':
			return 'treeAndlog';
		case 'log':
			return 'log';
		case 'treeAndinfoAndlog':
		default:
			return 'treeAndinfoAndlog';
	}
}

const LOG_SIDEBAR_PATTERNS = [{ path: '/log/:runId' }];

export function LogSidebarNav() {
	const location = useLocation();
	const { runId } = useParams<LogPageParams>();
	const { isAvailable, getModeUrl, mainLinkUrl, setLastVisited } =
		useLogSidebarState();

	useEffect(() => {
		const pathMatch = matchPath('/log/:runId', location.pathname);
		if (pathMatch && runId) {
			const mode = getModeFromSearch(location.search);
			setLastVisited(mode, location.pathname + location.search, runId);
		}
	}, [location.pathname, location.search, runId, setLastVisited]);

	return (
		<SidebarNavCollapsibleContainer patterns={LOG_SIDEBAR_PATTERNS}>
			<SidebarNavCollapsibleContainer.Item>
				<SidebarNavLinkWrapper label="Log">
					<SidebarNavInternalLink
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
						disabled={!isAvailable}
					>
						<SidebarNavInternalLink.Icon name="Paper" size={28} />
						<SidebarNavInternalLink.Label>Log</SidebarNavInternalLink.Label>
					</SidebarNavInternalLink>
				</SidebarNavLinkWrapper>
				<SidebarNavInfoButton disabled={!isAvailable}>
					<LogDialog />
				</SidebarNavInfoButton>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SidebarNavSubmenuItemContainer
					to={getModeUrl('treeAndinfoAndlog')}
					pattern={{
						path: '/log/:runId',
						mode: 'treeAndinfoAndlog',
						defaultMode: 'log'
					}}
					disabled={!isAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LayoutLogHeaderSidebar" />
					<SidebarNavSubmenuItemContainer.Label>
						Tree+info+log
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<LogDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={getModeUrl('treeAndlog')}
					pattern={{
						path: '/log/:runId',
						mode: 'treeAndlog'
					}}
					disabled={!isAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LayoutLogSidebar" />
					<SidebarNavSubmenuItemContainer.Label>
						Tree+log
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<LogDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={getModeUrl('infoAndlog')}
					pattern={{
						path: '/log/:runId',
						mode: 'infoAndlog'
					}}
					disabled={!isAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LayoutLogHeader" />
					<SidebarNavSubmenuItemContainer.Label>
						Info+log
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<LogDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
				<SidebarNavSubmenuItemContainer
					to={getModeUrl('log')}
					pattern={{
						path: '/log/:runId',
						mode: 'log'
					}}
					disabled={!isAvailable}
					linkComponent={LinkWithProject}
				>
					<SidebarNavSubmenuItemContainer.Icon name="LayoutLogSingle" />
					<SidebarNavSubmenuItemContainer.Label>
						Log
					</SidebarNavSubmenuItemContainer.Label>
					<SidebarNavSubmenuItemContainer.InfoButton>
						<LogDialog />
					</SidebarNavSubmenuItemContainer.InfoButton>
				</SidebarNavSubmenuItemContainer>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}

type LogSidebarMode = 'log' | 'infoAndlog' | 'treeAndinfoAndlog' | 'treeAndlog';
