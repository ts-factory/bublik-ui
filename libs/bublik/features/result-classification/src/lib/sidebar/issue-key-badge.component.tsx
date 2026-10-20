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
import { formatBugKey } from '../classification/classification.utils';

export interface IssueKeyBadgeProps {
	/** `ref://TRACKER/KEY`, or null for an issue with no tracker key. */
	bugKey: string | null;
	/** Names the issue in the tooltip: the entry itself only says "Issue". */
	title: string;
	closed: boolean;
}

/**
 * The active issue's tracker key beside the Issue entry, in the key chip's
 * mono face. Only the key: the link out to the tracker stays on the issue
 * page, so the entry is one click, not two. Faded out, like the counts, when
 * the sidebar is collapsed.
 */
export function IssueKeyBadge({ bugKey, title, closed }: IssueKeyBadgeProps) {
	const { isSidebarOpen } = useSidebar();
	const label = formatBugKey(bugKey);

	if (!label) return null;

	const tooltip = closed
		? `${title} (${bugKey}, closed)`
		: `${title} (${bugKey})`;

	return (
		<Tooltip content={tooltip} side="right">
			<Badge
				as="span"
				variant={BadgeVariants.Neutral}
				// Sized like the count badges, in the key chip's mono face, with the
				// faint outline they take on the current item kept on always: the
				// entry is highlighted whenever an issue page is open, and the key
				// must hold up on it either way.
				className={cn(
					CLASSIFICATION_BADGE_CLASS,
					'mr-1.5 shrink-0 block py-0 px-1.5 leading-4 max-w-[9rem] truncate',
					'normal-case tracking-normal font-mono transition-opacity',
					'border-text-menu/15',
					closed && 'line-through opacity-60',
					!isSidebarOpen && 'opacity-0'
				)}
				data-testid="issue-sidebar-key"
				data-issue-state={closed ? 'closed' : undefined}
			>
				{label}
			</Badge>
		</Tooltip>
	);
}
