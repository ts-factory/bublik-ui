/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2021-2023 OKTET Labs Ltd. */
import { useSidebar, Tooltip, Icon, cn } from '@/shared/tailwind-ui';
import { LinkWithProject } from '@/bublik/features/projects';

export const SidebarLogoButton = () => {
	const { isSidebarOpen, toggleSidebar } = useSidebar();

	return (
		<Tooltip content="To toggle sidebar press `S`" side="right" sideOffset={15}>
			<div className="flex transition-all duration-500 text-primary">
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
				<LinkWithProject
					className="text-[1.375rem] font-bold ml-0.5 flex items-center rounded-[0.625rem] hover:bg-primary-wash transition-all px-1"
					to="/dashboard"
				>
					<span className="text-[1.375rem] leading-[0.75rem]">Bublik</span>
				</LinkWithProject>
			</div>
		</Tooltip>
	);
};
