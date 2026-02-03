/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect } from 'react';
import { useLocation, matchPath, useParams } from 'react-router-dom';

import { Icon } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarNavCollapsibleContainer,
	SidebarNavInfoButton,
	SidebarNavSubmenuItem,
	getSubmenuIsActive
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
						label="Log"
						icon={<Icon name="Paper" size={28} />}
						to={mainLinkUrl}
						linkComponent={LinkWithProject}
						disabled={!isAvailable}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavInfoButton disabled={!isAvailable}>
					<LogDialog />
				</SidebarNavInfoButton>
				<SidebarNavToggle />
			</SidebarNavCollapsibleContainer.Item>

			<SidebarNavCollapsibleContainer.Submenu>
				<SubmenuItem
					label="Tree+info+log"
					to={getModeUrl('treeAndinfoAndlog')}
					icon={<Icon name="LayoutLogHeaderSidebar" />}
					pattern={{
						path: '/log/:runId',
						mode: 'treeAndinfoAndlog'
					}}
					dialogContent={<LogDialog />}
					disabled={!isAvailable}
				/>
				<SubmenuItem
					label="Tree+log"
					to={getModeUrl('treeAndlog')}
					icon={<Icon name="LayoutLogSidebar" />}
					pattern={{
						path: '/log/:runId',
						mode: 'treeAndlog'
					}}
					dialogContent={<LogDialog />}
					disabled={!isAvailable}
				/>
				<SubmenuItem
					label="Info+log"
					to={getModeUrl('infoAndlog')}
					icon={<Icon name="LayoutLogHeader" />}
					pattern={{
						path: '/log/:runId',
						mode: 'infoAndlog'
					}}
					dialogContent={<LogDialog />}
					disabled={!isAvailable}
				/>
				<SubmenuItem
					label="Log"
					to={getModeUrl('log')}
					icon={<Icon name="LayoutLogSingle" />}
					pattern={{
						path: '/log/:runId',
						mode: 'log'
					}}
					dialogContent={<LogDialog />}
					disabled={!isAvailable}
				/>
			</SidebarNavCollapsibleContainer.Submenu>
		</SidebarNavCollapsibleContainer>
	);
}

type LogSidebarMode = 'log' | 'infoAndlog' | 'treeAndinfoAndlog' | 'treeAndlog';

interface SubmenuItemProps {
	label: string;
	to: string;
	icon: React.ReactNode;
	disabled?: boolean;
	dialogContent?: React.ReactNode;
	pattern?: { path: string; mode?: LogSidebarMode };
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
				defaultMode: 'log'
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
		/>
	);
}
