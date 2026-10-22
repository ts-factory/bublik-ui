/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { type LucideIcon, Monitor, Moon, Sun } from 'lucide-react';

import type { Theme } from '@/shared/hooks';

const THEME_OPTIONS: Record<
	Theme,
	{
		label: string;
		description: string;
		icon: LucideIcon;
	}
> = {
	system: {
		label: 'System',
		description: 'Follow the operating system setting',
		icon: Monitor
	},
	light: { label: 'Light', description: 'Always light', icon: Sun },
	dark: { label: 'Dark', description: 'Always dark', icon: Moon }
};

export { THEME_OPTIONS };
