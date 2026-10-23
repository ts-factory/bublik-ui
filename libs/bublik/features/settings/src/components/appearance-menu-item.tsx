/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { THEMES, type Theme, useTheme } from '@/shared/hooks';
import { cn, DropdownMenuItem, Tooltip } from '@/shared/tailwind-ui';

import type { SettingsTabConfig } from '../types';
import { THEME_OPTIONS } from './theme-options';

interface AppearanceMenuItemProps {
	tab: SettingsTabConfig;
	itemClassName: string;
	onOpenSettings: () => void;
}

/**
 * The Appearance entry of the account menu: the entry opens the Appearance
 * settings, and a tray of icon buttons at its right end switches the theme
 * in place. Dressed like the log row's mode switch in the sidebar. The
 * buttons are menu radio items, so arrow keys reach them, and picking one
 * keeps the menu open.
 */
function AppearanceMenuItem({
	tab,
	itemClassName,
	onOpenSettings
}: AppearanceMenuItemProps) {
	const { theme, setTheme } = useTheme();

	return (
		<div className="group/appearance relative">
			<DropdownMenuItem
				className={cn(itemClassName, 'pr-[92px]')}
				onSelect={onOpenSettings}
			>
				<span className="grid place-items-center size-[18px] shrink-0">
					{tab.icon}
				</span>
				{tab.label}
			</DropdownMenuItem>
			{/* Over the entry's right end, so the entry's highlight spans the
			    row. On that highlight a primary tray would melt in, so it takes
			    the surface colour there, like the log row's. */}
			<DropdownMenuPrimitive.RadioGroup
				aria-label="Theme"
				value={theme}
				onValueChange={(value) => setTheme(value as Theme)}
				className={cn(
					'absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md bg-primary/10 p-0.5',
					'group-has-[[role=menuitem][data-highlighted]]/appearance:bg-bg-primary'
				)}
			>
				{THEMES.map((value) => {
					const { label, icon: ThemeIcon } = THEME_OPTIONS[value];

					return (
						<Tooltip key={value} content={label} side="top" delayDuration={400}>
							<DropdownMenuPrimitive.RadioItem
								value={value}
								aria-label={`${label} theme`}
								data-testid={`account-menu-theme-${value}`}
								onSelect={(event) => event.preventDefault()}
								className={cn(
									'cursor-pointer rounded p-0.5 outline-none transition-colors',
									'rdx-state-checked:bg-primary rdx-state-checked:text-white',
									'rdx-state-unchecked:text-text-menu rdx-state-unchecked:hover:bg-primary-wash rdx-state-unchecked:hover:text-primary',
									'rdx-state-unchecked:data-[highlighted]:bg-primary-wash rdx-state-unchecked:data-[highlighted]:text-primary',
									'focus-visible:ring-2 focus-visible:ring-primary'
								)}
							>
								<ThemeIcon className="size-[18px]" strokeWidth={1.75} />
							</DropdownMenuPrimitive.RadioItem>
						</Tooltip>
					);
				})}
			</DropdownMenuPrimitive.RadioGroup>
		</div>
	);
}

export { AppearanceMenuItem };
