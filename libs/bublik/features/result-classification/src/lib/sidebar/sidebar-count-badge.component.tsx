/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import {
	Badge,
	BadgeVariants,
	Tooltip,
	cn,
	useSidebar
} from '@/shared/tailwind-ui';

import { CLASSIFICATION_BADGE_CLASS } from '../classification/classification.constants';

export interface SidebarCountBadgeProps {
	count: number;
	tooltip: string;
	/** The sidebar item it sits on is the current page. */
	isActive: boolean;
	testId: string;
}

/**
 * A sidebar item's plain total, in grey: how many rows the page it links to
 * lists. The open-issue badge beside it is green because it counts a state
 * rather than everything; this one counts everything, so it stays quiet.
 */
export function SidebarCountBadge({
	count,
	tooltip,
	isActive,
	testId
}: SidebarCountBadgeProps) {
	const { isSidebarOpen } = useSidebar();

	return (
		<Tooltip content={tooltip} side="right">
			<Badge
				as="span"
				variant={BadgeVariants.Neutral}
				// Sized like the open-issue badge, so the two line up when both
				// show. On the current item it takes a faint outline, so it holds
				// up on the highlight without turning into a chip. Faded out,
				// like the labels, when the sidebar is collapsed to its icons.
				className={cn(
					CLASSIFICATION_BADGE_CLASS,
					'ml-auto py-0 px-1.5 leading-4 tabular-nums transition-opacity',
					isActive && 'border-text-menu/15',
					!isSidebarOpen && 'opacity-0'
				)}
				data-testid={testId}
			>
				{count}
			</Badge>
		</Tooltip>
	);
}
