/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { THEMES, useTheme } from '@/shared/hooks';

import type { SettingsTabConfig } from '../types';
import { THEME_OPTIONS } from './theme-options';
import { TrayMenuItem } from './tray-menu-item';

interface AppearanceMenuItemProps {
	tab: SettingsTabConfig;
	itemClassName: string;
	onOpenSettings: () => void;
}

const THEME_TRAY_OPTIONS = THEMES.map((value) => ({
	value,
	...THEME_OPTIONS[value]
}));

/**
 * The Appearance entry of the account menu: the entry opens the Appearance
 * settings, and its tray switches the theme in place
 */
function AppearanceMenuItem({
	tab,
	itemClassName,
	onOpenSettings
}: AppearanceMenuItemProps) {
	const { theme, setTheme } = useTheme();

	return (
		<TrayMenuItem
			icon={tab.icon}
			label={tab.label}
			itemClassName={itemClassName}
			onOpenSettings={onOpenSettings}
			ariaLabel="Theme"
			value={theme}
			onValueChange={setTheme}
			options={THEME_TRAY_OPTIONS}
			testIdPrefix="account-menu-theme"
		/>
	);
}

export { AppearanceMenuItem };
