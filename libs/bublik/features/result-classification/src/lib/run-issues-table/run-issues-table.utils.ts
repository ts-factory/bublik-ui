/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import type { RunIssueRow } from '@/shared/types';

import { makeSearchFilter } from '../classification-table/classification-table.utils';

export const searchFilter = makeSearchFilter<RunIssueRow>((issue) => [
	issue.title,
	issue.description,
	issue.bug_key,
	`#${issue.issue_id}`
]);
