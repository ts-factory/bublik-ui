/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { Badge, Tooltip, cn } from '@/shared/tailwind-ui';

import { CLASSIFICATION_BADGE_CLASS } from '../classification/classification.constants';
import { issueStateMeta } from '../classification/classification.utils';

export interface OpenIssueCountBadgeProps {
	count: number;
	tooltip: string;
	/** The sidebar item it sits on is the current page. */
	isActive: boolean;
	testId: string;
}

/**
 * A sidebar item's open-issue count, as "N | OPEN" in the State column's Open
 * colours, so "open" reads on the badge itself: the page it links to lists
 * closed issues too, and its total would otherwise look like a mismatch.
 */
export function OpenIssueCountBadge({
	count,
	tooltip,
	isActive,
	testId
}: OpenIssueCountBadgeProps) {
	const openMeta = issueStateMeta('open');

	return (
		<Tooltip content={tooltip} side="right">
			<Badge
				as="span"
				variant={openMeta.variant}
				// Sized like the toolbar filters' chips (`py-0 px-1.5 leading-4`),
				// not the table cell's taller badge. On the current item it keeps
				// the Open badge's hover border, so it holds up on the highlight.
				className={cn(
					CLASSIFICATION_BADGE_CLASS,
					'ml-auto gap-1 py-0 px-1.5 leading-4 tabular-nums',
					isActive && 'border-text-expected/40'
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
