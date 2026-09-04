/* SPDX-License-Identifier: Apache-2.0 */
/* SPDX-FileCopyrightText: 2026 OKTET LTD */
import { useMemo } from 'react';

import {
	CATEGORY_ORDER,
	ISSUE_RULES_STATE_META,
	RULES_STATE_ORDER,
	categoryMeta,
	issueStateMeta
} from '../classification/classification.utils';
import {
	buildFacetOptions,
	openFacetOptions
} from '../classification-table/classification-table.utils';
import type { IssueTableRow } from './issues-table.types';

/**
 * TODO(api): counted over the current page only, because that is all the table
 * holds once the server owns paging. `getIssuesFacets` is the intended source;
 * until it exists the numbers describe the page, not the project.
 */
export function useFacetOptions(rows: IssueTableRow[]) {
	return useMemo(
		() => ({
			stateOptions: buildFacetOptions({
				values: rows.map((row) => row.state),
				order: ['open', 'closed'] as const,
				labelFor: (state) => issueStateMeta(state).label
			}),
			rulesOptions: buildFacetOptions({
				values: rows.map((row) => row.rulesState),
				order: RULES_STATE_ORDER,
				labelFor: (value) => ISSUE_RULES_STATE_META[value].label
			}),
			categoryOptions: buildFacetOptions({
				values: rows.flatMap((row) => row.categories),
				order: CATEGORY_ORDER,
				labelFor: (category) => categoryMeta(category).displayValue
			}),
			projectOptions: openFacetOptions(rows.flatMap((row) => row.projectNames))
		}),
		[rows]
	);
}
