/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	AlignHorizontalSpaceAround,
	type LucideIcon,
	MoveHorizontal,
	PanelLeft
} from 'lucide-react';

import type { PageLayout } from '@/shared/hooks';

const LAYOUT_OPTIONS: Record<
	PageLayout,
	{
		label: string;
		description: string;
		icon: LucideIcon;
	}
> = {
	full: {
		label: 'Full width',
		description: 'Pages use the whole screen',
		icon: MoveHorizontal
	},
	'sidebar-left': {
		label: 'Left sidebar',
		description:
			'Sidebar at the left edge, pages capped and centered beside it',
		icon: PanelLeft
	},
	centered: {
		label: 'Centered',
		description: 'Sidebar and pages capped and centered on the screen',
		icon: AlignHorizontalSpaceAround
	}
};

export { LAYOUT_OPTIONS };
