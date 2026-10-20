/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { formatBugKey } from '../classification/classification.utils';
import { SidebarKeyBadge } from './sidebar-key-badge.component';

export interface IssueKeyBadgeProps {
	/** `ref://TRACKER/KEY`, or null for an issue with no tracker key. */
	bugKey: string | null;
	/** Names the issue in the tooltip: the entry itself only says "Issue". */
	title: string;
	closed: boolean;
}

/**
 * The active issue's tracker key on the Issue entry. Only the key: the link
 * out to the tracker stays on the issue page, so the entry is one click, not
 * two, and that click follows the entry to the issue.
 */
export function IssueKeyBadge({ bugKey, title, closed }: IssueKeyBadgeProps) {
	const label = formatBugKey(bugKey);

	if (!label) return null;

	const tooltip = closed
		? `${title} (${bugKey}, closed)`
		: `${title} (${bugKey})`;

	return (
		<SidebarKeyBadge
			label={label}
			tooltip={tooltip}
			closed={closed}
			testId="issue-sidebar-key"
		/>
	);
}
