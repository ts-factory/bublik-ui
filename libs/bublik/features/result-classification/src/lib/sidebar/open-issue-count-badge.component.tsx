/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Badge, Tooltip, cn, useSidebar } from '@/shared/tailwind-ui';

import { CLASSIFICATION_META_BADGE_CLASS } from '../classification/classification.constants';
import { issueStateMeta } from '../classification/classification.utils';

export interface OpenIssueCountBadgeProps {
	count: number;
	tooltip: string;
	/** The sidebar item it sits on is the current page. */
	isActive: boolean;
	testId: string;
	className?: string;
}

/**
 * A sidebar item's open-issue count, as "N | OPEN", styled exactly like the
 * State column's Open badge — green fill, body-colour text, as every meta
 * badge — so "open" reads on the badge itself: the page it links to lists
 * closed issues too, and its total would otherwise look like a mismatch.
 */
export function OpenIssueCountBadge({
	count,
	tooltip,
	isActive,
	testId,
	className
}: OpenIssueCountBadgeProps) {
	const openMeta = issueStateMeta('open');
	const { isSidebarOpen } = useSidebar();

	return (
		<Tooltip content={tooltip} side="right">
			<Badge
				as="span"
				variant={openMeta.variant}
				// Sized like the toolbar filters' chips (`py-0 px-1.5 leading-4`),
				// not the table cell's taller badge. On the current item it keeps
				// the Open badge's hover border, so it holds up on the highlight.
				// Faded out, like the labels, when the sidebar is collapsed.
				className={cn(
					CLASSIFICATION_META_BADGE_CLASS,
					'ml-auto gap-1 py-0 px-1.5 leading-4 tabular-nums transition-opacity',
					isActive && 'border-text-expected/40',
					!isSidebarOpen && 'opacity-0',
					className
				)}
				data-testid={testId}
			>
				{count}
				<span aria-hidden className="opacity-50">
					|
				</span>
				{openMeta.label}
			</Badge>
		</Tooltip>
	);
}
