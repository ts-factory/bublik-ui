/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2024-2026 OKTET LTD */
import { useState } from 'react';
import { LogIn } from 'lucide-react';

import type { AuthenticatedUser } from '@/bublik/features/auth';
import {
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Icon,
	ProfilePicture,
	sidebarPaddingTransition,
	Tooltip
} from '@/shared/tailwind-ui';

import { useSettingsTabs } from '../use-settings-tabs';
import type { SettingsTab } from '../types';
import { getUserLabel } from '../user-label';

interface SidebarAccountRowProps {
	user: AuthenticatedUser | null;
	isLoading: boolean;
	isSidebarOpen: boolean;
	isActive: boolean;
	onOpenSettings: (tab: SettingsTab) => void;
	onSignOut: () => void;
	onSignIn: () => void;
}

const menuItemStyles = 'gap-2.5 px-2 py-2 text-sm cursor-pointer';

/**
 * Last sidebar footer item: who is signed in, opening an account menu with
 * the settings sections and sign out / sign in.
 */
function SidebarAccountRow({
	user,
	isLoading,
	isSidebarOpen,
	isActive,
	onOpenSettings,
	onSignOut,
	onSignIn
}: SidebarAccountRowProps) {
	const { name, detail } = user ? getUserLabel(user) : { name: 'Guest' };
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const tabs = useSettingsTabs();

	if (!isLoading && !user) {
		return (
			<li>
				<Tooltip
					content="Sign In"
					side="right"
					delayDuration={700}
					sideOffset={15}
					disabled={isSidebarOpen}
				>
					<button
						aria-label="Sign In"
						onClick={onSignIn}
						style={sidebarPaddingTransition}
						className={cn(
							// Padding is 1px less than the account row to offset the border
							'flex w-full min-w-0 h-[42px] items-center gap-3 rounded-[0.625rem] border border-border-primary pr-[9px] text-left text-text-menu',
							'hover:bg-primary-wash focus-visible:outline-none hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary',
							isSidebarOpen ? 'pl-[15px]' : 'pl-1.5'
						)}
					>
						<div className="size-7 grid place-items-center shrink-0">
							<Icon name="BoxArrowRight" className="size-6" />
						</div>
						<span className="truncate font-medium leading-5 text-[1.125rem]">
							Sign In
						</span>
					</button>
				</Tooltip>
			</li>
		);
	}

	return (
		<li>
			{/* Non-modal: a modal menu closing while the settings dialog opens
			    can leave pointer-events: none stuck on the body */}
			<DropdownMenu
				modal={false}
				open={isMenuOpen}
				onOpenChange={setIsMenuOpen}
			>
				<Tooltip
					content={`${name} · Account menu`}
					side="right"
					delayDuration={700}
					sideOffset={15}
					disabled={isSidebarOpen || isMenuOpen}
				>
					<DropdownMenuTrigger asChild>
						<button
							aria-label={`${name} · Account menu`}
							style={sidebarPaddingTransition}
							className={cn(
								'flex w-full min-w-0 h-[42px] items-center gap-3 rounded-[0.625rem] pr-2.5 text-left text-text-menu',
								'hover:bg-primary-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
								isSidebarOpen ? 'pl-4' : 'pl-2',
								// Not rdx-state-open: the tooltip trigger shares this button and
								// its data-state ("closed") overrides the menu's "open"
								(isMenuOpen || isActive) && 'bg-primary-wash'
							)}
						>
							<div className="size-7 grid place-items-center shrink-0">
								{isLoading ? (
									<div className="size-7 rounded-full bg-slate-3 animate-pulse" />
								) : (
									<ProfilePicture
										displayName={name}
										className="size-7 text-[9px]"
									/>
								)}
							</div>
							{!isLoading ? (
								<div className="flex flex-col flex-1 min-w-0">
									<span className="truncate text-sm font-medium leading-5 text-text-primary">
										{name}
									</span>
									{detail ? (
										<span className="truncate text-xs leading-4 text-text-menu">
											{detail}
										</span>
									) : null}
								</div>
							) : null}
							{isSidebarOpen ? (
								<Icon
									name="ArrowShortUpDown"
									size={24}
									className="shrink-0 mr-[7px]"
								/>
							) : null}
						</button>
					</DropdownMenuTrigger>
				</Tooltip>

				<DropdownMenuContent
					side={isSidebarOpen ? 'top' : 'right'}
					align={isSidebarOpen ? 'start' : 'end'}
					sideOffset={8}
					className="w-[--radix-dropdown-menu-trigger-width] min-w-[220px]"
				>
					<DropdownMenuLabel className="px-2 py-2 font-normal">
						<div className="truncate text-sm font-semibold text-text-primary">
							{name}
						</div>
						<div className="truncate text-xs text-text-menu">
							{user ? detail ?? 'Signed in' : 'Not signed in'}
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />

					{tabs.map((tab) => (
						<DropdownMenuItem
							key={tab.id}
							className={menuItemStyles}
							onSelect={() => onOpenSettings(tab.id)}
						>
							<span className="grid place-items-center size-[18px] shrink-0">
								{tab.icon}
							</span>
							{tab.label}
						</DropdownMenuItem>
					))}

					<DropdownMenuSeparator />
					{user ? (
						<DropdownMenuItem
							className={cn(
								menuItemStyles,
								'text-text-unexpected focus:bg-red-50 focus:text-text-unexpected'
							)}
							onSelect={onSignOut}
						>
							<Icon name="BoxArrowRight" size={18} />
							Sign Out
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem className={menuItemStyles} onSelect={onSignIn}>
							<LogIn className="size-[18px]" />
							Sign In
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</li>
	);
}

export { SidebarAccountRow };
