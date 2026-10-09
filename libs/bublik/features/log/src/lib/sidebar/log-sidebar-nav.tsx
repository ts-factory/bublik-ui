/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarNavCollapsibleContainer,
	SidebarNavInfoButton,
	SidebarNavSubmenuItemContainer
} from '@/bublik/features/sidebar-nav';
import { useLogSidebarState } from './use-log-sidebar-state';

import { LogDialog } from './log-dialog';

const LOG_SIDEBAR_PATTERNS = [{ path: '/log/:runId' }];

export function LogSidebarNav() {
	// The log page records itself (`log-feature.tsx`); a writer here would be
	// a second one in the same commit, and they clobber each other's `_s`.
	const { isAvailable, getModeUrl, mainLinkUrl } = useLogSidebarState();

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
