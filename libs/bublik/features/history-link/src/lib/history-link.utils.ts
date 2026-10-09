/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { HistorySearch } from '@/shared/utils';

type HistoryLinkProps = HistorySearch[keyof HistorySearch];

/**
 * Lays the history page's `?issue=<id>` filter over an existing link: an
 * issue the link already carries is replaced in place, a new one goes last,
 * as `URLSearchParams.set` placed it.
 */
function withIssue(link: HistoryLinkProps, issueId: number): HistoryLinkProps {
	return { ...link, search: { ...link.search, issue: String(issueId) } };
}

export { withIssue };
