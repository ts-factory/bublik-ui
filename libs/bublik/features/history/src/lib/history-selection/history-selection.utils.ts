/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { HistoryAPIBackendQuery } from '@/shared/types';

/**
 * What a history page's result selection belongs to: the test and the
 * project it is read in, as `history:<projects>:<test>`. The other filters
 * narrow the rows of the same history, so picks survive a change of them, a
 * page change and a reload; another test, or another project, starts empty.
 * Kept apart from the run pages' `run:<id>` and `runs:<ids>`.
 */
function historySelectionScope(
	query: Pick<HistoryAPIBackendQuery, 'testName' | 'projects'>
): string {
	const projects = [...(query.projects ?? [])]
		.sort((left, right) => left - right)
		.join(',');

	return `history:${projects}:${query.testName ?? ''}`;
}

export { historySelectionScope };
