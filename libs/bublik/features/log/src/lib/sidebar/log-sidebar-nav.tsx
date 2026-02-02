/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useEffect, useState } from 'react';
import { useLocation, matchPath, useParams } from 'react-router-dom';

import { Dialog, DialogPortal, Icon, ModalContent } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	SidebarNavLinkWrapper,
	SidebarNavInternalLink,
	SidebarNavToggle,
	SidebarAccordionLink,
	SidebarNavCollapsibleContainer,
	SidebarNavInfoButton
} from '@/bublik/features/sidebar-nav';
import { LogPageParams } from '@/shared/types';
import { useLogSidebarState } from './use-log-sidebar-state';

import { LogDialog } from './log-dialog';

function useIsActive(patterns: { path: string }[]) {
	const location = useLocation();
	return patterns.some((p) => matchPath(p.path, location.pathname));
}

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

export function LogSidebarNav() {
	const location = useLocation();
	const { runId } = useParams<LogPageParams>();
	const { isAvailable, getModeUrl, mainLinkUrl, setLastVisited } =
		useLogSidebarState();

	const isActive = useIsActive([{ path: '/log/:runId' }]);

	useEffect(() => {
		const pathMatch = matchPath('/log/:runId', location.pathname);
		if (pathMatch && runId) {
			const mode = getModeFromSearch(location.search);
			setLastVisited(mode, location.pathname + location.search, runId);
		}
	}, [location.pathname, location.search, runId, setLastVisited]);

	return (
		<SidebarNavCollapsibleContainer isActive={isActive}>
			<SidebarNavCollapsibleContainer.Item isActive={isActive}>
				<SidebarNavLinkWrapper label="Log">
					<SidebarNavInternalLink
						label="Log"
						icon={<Icon name="Paper" size={28} />}
						to={mainLinkUrl}
						isActive={isActive}
						linkComponent={LinkWithProject}
						disabled={!isAvailable}
					/>
				</SidebarNavLinkWrapper>
				<SidebarNavInfoButton disabled={!isAvailable}>
					<LogDialog />
				</SidebarNavInfoButton>
				<SidebarNavToggle isActive={isActive} />
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

	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const pathMatch = pattern ? matchPath(pattern.path, location.pathname) : null;

	const searchParams = new URLSearchParams(location.search);
	const currentMode = searchParams.get('mode') || 'log';
	const modeMatch = pattern?.mode ? currentMode === pattern.mode : true;

	const isActive = !!pathMatch && modeMatch;

	const shouldShowDialog = disabled;

	const handleClick = (e: React.MouseEvent) => {
		if (shouldShowDialog) {
			e.preventDefault();
			setIsDialogOpen(true);
		}
	};

	return (
		<>
			<SidebarAccordionLink
				label={label}
				icon={icon}
				to={to}
				isActive={isActive}
				disabled={disabled}
				linkComponent={LinkWithProject}
				onClick={handleClick}
				dialogContent={dialogContent}
				onDialogOpen={
					disabled && dialogContent ? () => setIsDialogOpen(true) : undefined
				}
			/>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogPortal>
					<ModalContent>
						{dialogContent || (
							<div className="bg-white p-6 rounded-lg">
								<h2 className="text-lg font-semibold mb-4">Not Available</h2>
								<p>This section is not available yet.</p>
							</div>
						)}
					</ModalContent>
				</DialogPortal>
			</Dialog>
		</>
	);
}
