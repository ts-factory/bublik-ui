/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { HoverCard, useSidebar, Tooltip, Icon, cn } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';
import {
	DeployInfoContainer,
	frontendAppVersion
} from '@/bublik/features/deploy-info';

export const SidebarLogoButton = () => {
	const { isSidebarOpen, toggleSidebar } = useSidebar();

	return (
		<div className="flex items-center transition-all duration-500 text-primary">
			<Tooltip
				content="To toggle sidebar press `S`"
				side="right"
				sideOffset={15}
			>
				<button
					onClick={toggleSidebar}
					aria-label="Toggle sidebar open state"
					className={cn(
						'flex-shrink-0 w-[42px] h-[42px] transition-all duration-500 hover:bg-primary-wash grid place-items-center rounded-[0.625rem]',
						isSidebarOpen ? 'ml-2' : 'ml-0'
					)}
				>
					<Icon
						name="SidebarArrows"
						className={cn(
							'transition-all duration-500',
							isSidebarOpen ? 'rotate-0' : 'rotate-180'
						)}
					/>
				</button>
			</Tooltip>
			<LinkWithProject
				className="text-[1.375rem] font-bold self-stretch ml-0.5 flex items-center rounded-[0.625rem] hover:bg-primary-wash transition-all px-1"
				to="/dashboard"
			>
				<span className="text-[1.375rem] leading-[0.75rem]">Bublik</span>
			</LinkWithProject>
			<HoverCard content={<DeployInfoContainer />} side="right" sideOffset={8}>
				<span
					data-testid="sidebar-version"
					className="ml-1 inline-flex translate-y-px items-center text-xs font-medium leading-none text-text-menu"
				>
					{frontendAppVersion}
				</span>
			</HoverCard>
		</div>
	);
};
