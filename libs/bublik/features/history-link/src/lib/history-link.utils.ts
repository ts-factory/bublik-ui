/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { HistorySearch } from '@/shared/utils';

type HistoryLinkProps = HistorySearch[keyof HistorySearch];

/** Lays the history page's `?issue=<id>` filter over an existing link. */
function withIssue(link: HistoryLinkProps, issueId: number): HistoryLinkProps {
	const to =
		typeof link.to === 'string'
			? new URL(link.to, 'http://localhost')
			: {
					pathname: link.to.pathname ?? '/history',
					search: link.to.search ?? ''
			  };
	const search = new URLSearchParams(to.search);
	search.set('issue', String(issueId));

	return {
		...link,
		to: { pathname: to.pathname, search: search.toString() }
	};
}

export { withIssue };
